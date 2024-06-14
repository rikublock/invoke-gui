import { Flex, IconButton, Spacer, Text } from '@invoke-ai/ui-library';
import { useAppDispatch, useAppSelector } from 'app/store/storeHooks';
import { IPAdapter } from 'features/controlLayers/components/ControlAndIPAdapter/IPAdapter';
import {
  regionalGuidanceIPAdapterBeginEndStepPctChanged,
  regionalGuidanceIPAdapterCLIPVisionModelChanged,
  regionalGuidanceIPAdapterDeleted,
  regionalGuidanceIPAdapterImageChanged,
  regionalGuidanceIPAdapterMethodChanged,
  regionalGuidanceIPAdapterModelChanged,
  regionalGuidanceIPAdapterWeightChanged,
  selectRGLayerIPAdapterOrThrow,
} from 'features/controlLayers/store/controlLayersSlice';
import type { CLIPVisionModelV2, IPMethodV2 } from 'features/controlLayers/util/controlAdapters';
import type { RGIPAdapterImageDropData } from 'features/dnd/types';
import { memo, useCallback, useMemo } from 'react';
import { PiTrashSimpleBold } from 'react-icons/pi';
import type { ImageDTO, IPAdapterModelConfig, RGIPAdapterImagePostUploadAction } from 'services/api/types';

type Props = {
  layerId: string;
  ipAdapterId: string;
  ipAdapterNumber: number;
};

export const RGLayerIPAdapterWrapper = memo(({ layerId, ipAdapterId, ipAdapterNumber }: Props) => {
  const dispatch = useAppDispatch();
  const onDeleteIPAdapter = useCallback(() => {
    dispatch(regionalGuidanceIPAdapterDeleted({ layerId, ipAdapterId }));
  }, [dispatch, ipAdapterId, layerId]);
  const ipAdapter = useAppSelector((s) => selectRGLayerIPAdapterOrThrow(s.canvasV2, layerId, ipAdapterId));

  const onChangeBeginEndStepPct = useCallback(
    (beginEndStepPct: [number, number]) => {
      dispatch(
        regionalGuidanceIPAdapterBeginEndStepPctChanged({
          layerId,
          ipAdapterId,
          beginEndStepPct,
        })
      );
    },
    [dispatch, ipAdapterId, layerId]
  );

  const onChangeWeight = useCallback(
    (weight: number) => {
      dispatch(regionalGuidanceIPAdapterWeightChanged({ layerId, ipAdapterId, weight }));
    },
    [dispatch, ipAdapterId, layerId]
  );

  const onChangeIPMethod = useCallback(
    (method: IPMethodV2) => {
      dispatch(regionalGuidanceIPAdapterMethodChanged({ layerId, ipAdapterId, method }));
    },
    [dispatch, ipAdapterId, layerId]
  );

  const onChangeModel = useCallback(
    (modelConfig: IPAdapterModelConfig) => {
      dispatch(regionalGuidanceIPAdapterModelChanged({ layerId, ipAdapterId, modelConfig }));
    },
    [dispatch, ipAdapterId, layerId]
  );

  const onChangeCLIPVisionModel = useCallback(
    (clipVisionModel: CLIPVisionModelV2) => {
      dispatch(regionalGuidanceIPAdapterCLIPVisionModelChanged({ layerId, ipAdapterId, clipVisionModel }));
    },
    [dispatch, ipAdapterId, layerId]
  );

  const onChangeImage = useCallback(
    (imageDTO: ImageDTO | null) => {
      dispatch(regionalGuidanceIPAdapterImageChanged({ layerId, ipAdapterId, imageDTO }));
    },
    [dispatch, ipAdapterId, layerId]
  );

  const droppableData = useMemo<RGIPAdapterImageDropData>(
    () => ({
      actionType: 'SET_RG_LAYER_IP_ADAPTER_IMAGE',
      context: {
        layerId,
        ipAdapterId,
      },
      id: layerId,
    }),
    [ipAdapterId, layerId]
  );

  const postUploadAction = useMemo<RGIPAdapterImagePostUploadAction>(
    () => ({
      type: 'SET_RG_LAYER_IP_ADAPTER_IMAGE',
      layerId,
      ipAdapterId,
    }),
    [ipAdapterId, layerId]
  );

  return (
    <Flex flexDir="column" gap={3}>
      <Flex alignItems="center" gap={3}>
        <Text fontWeight="semibold" color="base.400">{`IP Adapter ${ipAdapterNumber}`}</Text>
        <Spacer />
        <IconButton
          size="sm"
          icon={<PiTrashSimpleBold />}
          aria-label="Delete IP Adapter"
          onClick={onDeleteIPAdapter}
          variant="ghost"
          colorScheme="error"
        />
      </Flex>
      <IPAdapter
        ipAdapter={ipAdapter}
        onChangeBeginEndStepPct={onChangeBeginEndStepPct}
        onChangeWeight={onChangeWeight}
        onChangeIPMethod={onChangeIPMethod}
        onChangeModel={onChangeModel}
        onChangeCLIPVisionModel={onChangeCLIPVisionModel}
        onChangeImage={onChangeImage}
        droppableData={droppableData}
        postUploadAction={postUploadAction}
      />
    </Flex>
  );
});

RGLayerIPAdapterWrapper.displayName = 'RGLayerIPAdapterWrapper';