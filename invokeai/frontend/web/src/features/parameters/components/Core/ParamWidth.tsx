import { CompositeNumberInput, CompositeSlider, FormControl, FormLabel } from '@invoke-ai/ui-library';
import { useAppDispatch, useAppSelector } from 'app/store/storeHooks';
import { InformationalPopover } from 'common/components/InformationalPopover/InformationalPopover';
import { documentWidthChanged } from 'features/controlLayers/store/canvasV2Slice';
import { selectOptimalDimension } from 'features/controlLayers/store/selectors';
import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export const ParamWidth = memo(() => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const width = useAppSelector((s) => s.canvasV2.document.width);
  const optimalDimension = useAppSelector(selectOptimalDimension);
  const sliderMin = useAppSelector((s) => s.config.sd.width.sliderMin);
  const sliderMax = useAppSelector((s) => s.config.sd.width.sliderMax);
  const numberInputMin = useAppSelector((s) => s.config.sd.width.numberInputMin);
  const numberInputMax = useAppSelector((s) => s.config.sd.width.numberInputMax);
  const coarseStep = useAppSelector((s) => s.config.sd.width.coarseStep);
  const fineStep = useAppSelector((s) => s.config.sd.width.fineStep);

  const onChange = useCallback(
    (v: number) => {
      dispatch(documentWidthChanged({ width: v }));
    },
    [dispatch]
  );

  const marks = useMemo(() => [sliderMin, optimalDimension, sliderMax], [sliderMin, optimalDimension, sliderMax]);

  return (
    <FormControl>
      <InformationalPopover feature="paramWidth">
        <FormLabel>{t('parameters.width')}</FormLabel>
      </InformationalPopover>
      <CompositeSlider
        value={width}
        onChange={onChange}
        defaultValue={optimalDimension}
        min={sliderMin}
        max={sliderMax}
        step={coarseStep}
        fineStep={fineStep}
        marks={marks}
      />
      <CompositeNumberInput
        value={width}
        onChange={onChange}
        defaultValue={optimalDimension}
        min={numberInputMin}
        max={numberInputMax}
        step={coarseStep}
        fineStep={fineStep}
      />
    </FormControl>
  );
});

ParamWidth.displayName = 'ParamWidth';
