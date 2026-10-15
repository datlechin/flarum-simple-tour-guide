import app from 'flarum/admin/app';
import extractText from 'flarum/common/utils/extractText';

export default function deviceOptions(): Record<string, string> {
  return {
    any: extractText(app.translator.trans('datlechin-simple-tour-guide.admin.devices.any')),
    desktop: extractText(app.translator.trans('datlechin-simple-tour-guide.admin.devices.desktop')),
    mobile: extractText(app.translator.trans('datlechin-simple-tour-guide.admin.devices.mobile')),
  };
}
