import ArcGISSettingsSection from './settings/ArcGISSettingsSection';

export default function SettingsPanel() {
  return (
    <div className="max-h-[calc(100vh-180px)] overflow-auto">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Application Settings</h3>
        <p className="text-sm text-slate-400 mb-4">
          Credentials and preferences for the studio. Settings are saved locally in your browser.
        </p>
      </div>

      <ArcGISSettingsSection />
    </div>
  );
}
