import { IconButton } from '@invoke-ai/ui-library';
import { useAppDispatch, useAppSelector } from 'app/store/storeHooks';
import { toolChanged } from 'features/controlLayers/store/canvasV2Slice';
import { isDrawableEntityType } from 'features/controlLayers/store/types';
import { memo, useCallback } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useTranslation } from 'react-i18next';
import { PiEraserBold } from 'react-icons/pi';

export const EraserToolButton = memo(() => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const isSelected = useAppSelector((s) => s.canvasV2.tool.selected === 'eraser');
  const isDisabled = useAppSelector((s) => {
    const entityType = s.canvasV2.selectedEntityIdentifier?.type;
    const isDrawingToolAllowed = entityType ? isDrawableEntityType(entityType) : false;
    const isStaging = s.canvasV2.session.isStaging;
    return !isDrawingToolAllowed || isStaging || s.canvasV2.tool.isTransforming;
  });

  const onClick = useCallback(() => {
    dispatch(toolChanged('eraser'));
  }, [dispatch]);

  useHotkeys('e', onClick, { enabled: !isDisabled }, [isDisabled, onClick]);

  return (
    <IconButton
      aria-label={`${t('unifiedCanvas.eraser')} (E)`}
      tooltip={`${t('unifiedCanvas.eraser')} (E)`}
      icon={<PiEraserBold />}
      colorScheme={isSelected ? 'invokeBlue' : 'base'}
      variant="outline"
      onClick={onClick}
      isDisabled={isDisabled}
    />
  );
});

EraserToolButton.displayName = 'EraserToolButton';
