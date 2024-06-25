import type Mithril from 'mithril';
import app from 'flarum/admin/app';
import ExtensionPage from 'flarum/admin/components/ExtensionPage';
import Button from 'flarum/common/components/Button';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import EditTourGuideStepModal from './EditTourGuideStepModal';
import TourGuideStep from 'src/common/models/TourGuideStep';

export default class SettingsPage extends ExtensionPage {
  oninit(vnode: Mithril.Vnode) {
    super.oninit(vnode);

    this.loading = true;

    app.store.find<TourGuideStep[]>(`tour-guide-steps`).then((steps) => {
      app.store.pushPayload(steps.payload);
      this.loading = false;

      m.redraw();
    });
  }

  content() {
    const tourGuideSteps: TourGuideStep[] = app.store.all('tour-guide-steps');

    return (
      <div className="ExtensionPage-settings">
        <div className="container">
          <div className="Form">
            {this.buildSettingComponent({
              setting: 'datlechin-simple-tour-guide.show_progress',
              type: 'boolean',
              label: app.translator.trans('datlechin-simple-tour-guide.admin.settings.show_progress_label'),
              help: app.translator.trans('datlechin-simple-tour-guide.admin.settings.show_progress_help'),
            })}
            {this.buildSettingComponent({
              setting: 'datlechin-simple-tour-guide.allow_close',
              type: 'boolean',
              label: app.translator.trans('datlechin-simple-tour-guide.admin.settings.allow_close_label'),
              help: app.translator.trans('datlechin-simple-tour-guide.admin.settings.allow_close_help'),
            })}
            {this.buildSettingComponent({
              setting: 'datlechin-simple-tour-guide.skip_null_elements',
              type: 'boolean',
              label: app.translator.trans('datlechin-simple-tour-guide.admin.settings.skip_null_elements_label'),
              help: app.translator.trans('datlechin-simple-tour-guide.admin.settings.skip_null_elements_help'),
            })}
            <div className="Form-group">
              <Button className="Button" icon="fas fa-plus" onclick={() => app.modal.show(EditTourGuideStepModal)}>
                {app.translator.trans('datlechin-simple-tour-guide.admin.add_step')}
              </Button>
            </div>
            {this.loading ? (
              <LoadingIndicator />
            ) : (
              <>
                {tourGuideSteps.length > 0 && (
                  <table className="TourGuideSteps-Table">
                    <thead>
                      <tr>
                        <th>{app.translator.trans('datlechin-simple-tour-guide.admin.title')}</th>
                        <th>{app.translator.trans('datlechin-simple-tour-guide.admin.target')}</th>
                        <th>{app.translator.trans('datlechin-simple-tour-guide.admin.trigger_click')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tourGuideSteps.map((step) => (
                        <tr>
                          <td>{step.title()}</td>
                          <td>
                            {step.target()}
                            <Button
                              className="Button Button--icon"
                              icon="fas fa-edit"
                              onclick={() => app.modal.show(EditTourGuideStepModal, { model: step })}
                            />
                          </td>
                          <td>
                            {step.isTriggerClick()
                              ? app.translator.trans('datlechin-simple-tour-guide.admin.yes')
                              : app.translator.trans('datlechin-simple-tour-guide.admin.no')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
            <div className="Form-group">{this.submitButton()}</div>
          </div>
        </div>
      </div>
    );
  }
}
