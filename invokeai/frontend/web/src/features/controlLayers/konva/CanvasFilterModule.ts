import type { SerializableObject, SerializableObject } from 'common/types';
import type { CanvasLayerAdapter } from 'features/controlLayers/konva/CanvasLayerAdapter';
import type { CanvasManager } from 'features/controlLayers/konva/CanvasManager';
import { getPrefixedId } from 'features/controlLayers/konva/util';
import type { CanvasEntityIdentifier, CanvasImageState, FilterConfig } from 'features/controlLayers/store/types';
import { IMAGE_FILTERS, imageDTOToImageObject } from 'features/controlLayers/store/types';
import { atom } from 'nanostores';
import type { Logger } from 'roarr';
import { getImageDTO } from 'services/api/endpoints/images';
import type { BatchConfig, ImageDTO } from 'services/api/types';
import type { InvocationCompleteEvent } from 'services/events/types';
import { assert } from 'tsafe';

const TYPE = 'entity_filter_preview';

export class CanvasFilterModule {
  readonly type = TYPE;

  id: string;
  path: string[];
  manager: CanvasManager;
  log: Logger;

  imageState: CanvasImageState | null = null;

  $adapter = atom<CanvasLayerAdapter | null>(null);
  $isProcessing = atom<boolean>(false);
  $config = atom<FilterConfig>(IMAGE_FILTERS.canny_image_processor.buildDefaults());

  constructor(manager: CanvasManager) {
    this.id = getPrefixedId(this.type);
    this.manager = manager;
    this.path = this.manager.path.concat(this.id);
    this.log = this.manager.buildLogger(this.getLoggingContext);
    this.log.trace('Creating filter');
  }

  initialize = (entityIdentifier: CanvasEntityIdentifier) => {
    this.log.trace('Initializing filter');
    const entity = this.manager.stateApi.getEntity(entityIdentifier);
    if (!entity) {
      this.log.warn({ entityIdentifier }, 'Unable to find entity');
      return;
    }
    if (entity.type !== 'raster_layer' && entity.type !== 'control_layer') {
      this.log.warn({ entityIdentifier }, 'Unsupported entity type');
      return;
    }
    this.$adapter.set(entity.adapter);
  };

  previewFilter = async () => {
    const adapter = this.$adapter.get();
    if (!adapter) {
      this.log.warn('Cannot preview filter without an adapter');
      return;
    }
    const config = this.$config.get();
    this.log.trace({ config }, 'Previewing filter');
    const rect = adapter.transformer.getRelativeRect();
    const imageDTO = await adapter.renderer.rasterize({ rect });
    const nodeId = getPrefixedId('filter_node');
    const batch = this.buildBatchConfig(imageDTO, config, nodeId);

    // Listen for the filter processing completion event
    const listener = async (event: InvocationCompleteEvent) => {
      if (event.origin !== this.id || event.invocation_source_id !== nodeId) {
        return;
      }
      this.manager.socket.off('invocation_complete', listener);

      this.log.trace({ event } as SerializableObject, 'Handling filter processing completion');

      const { result } = event;
      assert(result.type === 'image_output', `Processor did not return an image output, got: ${result}`);

      const imageDTO = await getImageDTO(result.image.image_name);
      assert(imageDTO, "Failed to fetch processor output's image DTO");

      this.imageState = imageDTOToImageObject(imageDTO);
      adapter.renderer.clearBuffer();

      await adapter.renderer.setBuffer(this.imageState);

      adapter.renderer.hideObjects();
      this.$isProcessing.set(false);
    };

    this.manager.socket.on('invocation_complete', listener);

    this.log.trace({ batch } as SerializableObject, 'Enqueuing filter batch');

    this.$isProcessing.set(true);
    this.manager.stateApi.enqueueBatch(batch);
  };

  applyFilter = () => {
    const imageState = this.imageState;
    const adapter = this.$adapter.get();
    if (!imageState) {
      this.log.warn('No image state to apply filter to');
      return;
    }
    if (!adapter) {
      this.log.warn('Cannot apply filter without an adapter');
      return;
    }
    this.log.trace('Applying filter');
    adapter.renderer.commitBuffer();
    const rect = adapter.transformer.getRelativeRect();
    this.manager.stateApi.rasterizeEntity({
      entityIdentifier: adapter.getEntityIdentifier(),
      imageObject: imageState,
      rect: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: imageState.image.height,
        height: imageState.image.width,
      },
      replaceObjects: true,
    });
    adapter.renderer.showObjects();
    this.imageState = null;
    this.$adapter.set(null);
  };

  cancelFilter = () => {
    this.log.trace('Cancelling filter');

    const adapter = this.$adapter.get();

    if (adapter) {
      adapter.renderer.clearBuffer();
      adapter.renderer.showObjects();
      this.$adapter.set(null);
    }
    this.imageState = null;
    this.$isProcessing.set(false);
  };

  buildBatchConfig = (imageDTO: ImageDTO, config: FilterConfig, id: string): BatchConfig => {
    // TODO(psyche): I can't get TS to be happy, it thinkgs `config` is `never` but it should be inferred from the generic... I'll just cast it for now
    const node = IMAGE_FILTERS[config.type].buildNode(imageDTO, config as never);
    node.id = id;
    const batch: BatchConfig = {
      prepend: true,
      batch: {
        graph: {
          nodes: {
            [node.id]: {
              ...node,
              // Control images are always intermediate - do not save to gallery
              // is_intermediate: true,
              is_intermediate: false, // false for testing
            },
          },
          edges: [],
        },
        origin: this.id,
        runs: 1,
      },
    };

    return batch;
  };

  destroy = () => {
    this.log.trace('Destroying filter');
  };

  repr = () => {
    return {
      id: this.id,
      type: this.type,
    };
  };

  getLoggingContext = (): SerializableObject => {
    return { ...this.manager.getLoggingContext(), path: this.path.join('.') };
  };
}