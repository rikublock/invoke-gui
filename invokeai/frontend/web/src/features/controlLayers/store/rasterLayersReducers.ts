import type { PayloadAction, SliceCaseReducers } from '@reduxjs/toolkit';
import { deepClone } from 'common/util/deepClone';
import { getPrefixedId } from 'features/controlLayers/konva/util';
import { merge } from 'lodash-es';
import { assert } from 'tsafe';

import type { CanvasControlLayerState, CanvasRasterLayerState, CanvasV2State } from './types';
import { initialControlNetV2 } from './types';

export const selectRasterLayer = (state: CanvasV2State, id: string) =>
  state.rasterLayers.entities.find((layer) => layer.id === id);
export const selectLayerOrThrow = (state: CanvasV2State, id: string) => {
  const layer = selectRasterLayer(state, id);
  assert(layer, `Layer with id ${id} not found`);
  return layer;
};

export const rasterLayersReducers = {
  rasterLayerAdded: {
    reducer: (
      state,
      action: PayloadAction<{ id: string; overrides?: Partial<CanvasRasterLayerState>; isSelected?: boolean }>
    ) => {
      const { id, overrides, isSelected } = action.payload;
      const layer: CanvasRasterLayerState = {
        id,
        name: null,
        type: 'raster_layer',
        isEnabled: true,
        objects: [],
        opacity: 1,
        position: { x: 0, y: 0 },
      };
      merge(layer, overrides);
      state.rasterLayers.entities.push(layer);
      if (isSelected) {
        state.selectedEntityIdentifier = { type: 'raster_layer', id };
      }
    },
    prepare: (payload: { overrides?: Partial<CanvasRasterLayerState>; isSelected?: boolean }) => ({
      payload: { ...payload, id: getPrefixedId('raster_layer') },
    }),
  },
  rasterLayerRecalled: (state, action: PayloadAction<{ data: CanvasRasterLayerState }>) => {
    const { data } = action.payload;
    state.rasterLayers.entities.push(data);
    state.selectedEntityIdentifier = { type: 'raster_layer', id: data.id };
  },
  rasterLayerAllDeleted: (state) => {
    state.rasterLayers.entities = [];
  },
  rasterLayerConvertedToControlLayer: {
    reducer: (state, action: PayloadAction<{ id: string; newId: string }>) => {
      const { id, newId } = action.payload;
      const layer = selectRasterLayer(state, id);
      if (!layer) {
        return;
      }

      // Convert the raster layer to control layer
      const controlLayerState: CanvasControlLayerState = {
        ...deepClone(layer),
        id: newId,
        type: 'control_layer',
        controlAdapter: deepClone(initialControlNetV2),
        withTransparencyEffect: true,
      };

      // Remove the raster layer
      state.rasterLayers.entities = state.rasterLayers.entities.filter((layer) => layer.id !== id);

      // Add the converted control layer
      state.controlLayers.entities.push(controlLayerState);

      state.selectedEntityIdentifier = { type: controlLayerState.type, id: controlLayerState.id };
    },
    prepare: (payload: { id: string }) => ({
      payload: { ...payload, newId: getPrefixedId('control_layer') },
    }),
  },
} satisfies SliceCaseReducers<CanvasV2State>;