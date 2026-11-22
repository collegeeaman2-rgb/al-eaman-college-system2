import { Lock } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import {
  ACTION_KEYS,
  MODULE_KEYS,
  normalizeModulePermissions,
  type ActionKey,
  type AssignableRole,
  type ModuleKey,
  type ModulePermissions,
} from '../types/governance';

interface PermissionMatrixEditorProps {
  role: AssignableRole;
  modules: ModulePermissions;
  onChange: (next: ModulePermissions) => void;
  readOnly?: boolean;
}

export function PermissionMatrixEditor({
  role,
  modules,
  onChange,
  readOnly = false,
}: PermissionMatrixEditorProps) {
  const { t } = useI18n();
  const isParent = role === 'parent';
  const normalizedModules = normalizeModulePermissions(modules);

  const toggle = (moduleKey: ModuleKey, actionKey: ActionKey) => {
    if (readOnly) return;
    if (isParent && actionKey !== 'view') return;

    const current = normalizedModules[moduleKey];
    const nextVal = !current[actionKey];
    const nextModule = { ...current, [actionKey]: nextVal };

    if (actionKey === 'view' && !nextVal) {
      nextModule.create = false;
      nextModule.edit = false;
      nextModule.delete = false;
      nextModule.approve = false;
    }
    if (actionKey !== 'view' && nextVal) {
      nextModule.view = true;
    }

    onChange({
      ...normalizedModules,
      [moduleKey]: nextModule,
    });
  };

  return (
    <div className="space-y-3">
      {isParent && (
        <div className="p-3.5 rounded-xl bg-[#F4F8FD] border border-[#D7E5F5] text-xs text-[#153E75] flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-[#2878D0] shrink-0" />
          <span>{t.labels.parentReadOnlyNote}</span>
        </div>
      )}

      {/* Desktop Matrix Table */}
      <div className="hidden md:block overflow-x-auto border border-[#D7E5F5] rounded-2xl bg-white">
        <table className="w-full text-start border-collapse">
          <thead>
            <tr className="border-b border-[#D7E5F5] bg-[#F4F8FD] text-xs font-semibold text-[#153E75]">
              <th className="py-3 px-4 text-start">Module</th>
              {ACTION_KEYS.map((action) => (
                <th key={action} className="py-3 px-3 text-center whitespace-nowrap">
                  {t.actions[action]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAF1FA]">
            {MODULE_KEYS.map((modKey) => (
              <tr key={modKey} className="hover:bg-[#F8FBFF] transition-colors">
                <td className="py-3 px-4">
                  <div className="text-sm font-medium text-[#172B45]">{t.modules[modKey].title}</div>
                  <div className="text-xs text-[#4B6484] mt-0.5">{t.modules[modKey].desc}</div>
                </td>
                {ACTION_KEYS.map((actionKey) => {
                  const checked = Boolean(normalizedModules[modKey]?.[actionKey]);
                  const disabled = readOnly || (isParent && actionKey !== 'view');
                  return (
                    <td key={actionKey} className="py-3 px-3 text-center">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={checked}
                        aria-label={`${t.modules[modKey].title} - ${t.actions[actionKey]}`}
                        disabled={disabled}
                        onClick={() => toggle(modKey, actionKey)}
                        className={`w-9 h-5 rounded-full transition-colors relative inline-flex items-center px-0.5 ${
                          disabled ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer'
                        } ${checked ? 'bg-[#2878D0]' : 'bg-[#C8D9EC]'}`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                            checked ? 'translate-x-4 rtl:-translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Touch-Friendly Module Cards */}
      <div className="md:hidden space-y-2.5">
        {MODULE_KEYS.map((modKey) => (
          <div
            key={modKey}
            className="bg-white border border-[#D7E5F5] rounded-2xl p-4 space-y-3"
          >
            <div>
              <div className="text-sm font-semibold text-[#172B45]">{t.modules[modKey].title}</div>
              <div className="text-xs text-[#4B6484] mt-0.5">{t.modules[modKey].desc}</div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {ACTION_KEYS.map((actionKey) => {
                const checked = Boolean(normalizedModules[modKey]?.[actionKey]);
                const disabled = readOnly || (isParent && actionKey !== 'view');
                return (
                  <button
                    key={actionKey}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggle(modKey, actionKey)}
                    className={`min-h-[44px] px-2.5 py-2 rounded-xl text-xs font-medium border transition-colors text-center leading-tight break-words ${
                      disabled ? 'opacity-40 cursor-not-allowed' : ''
                    } ${
                      checked
                        ? 'bg-[#2878D0] text-white border-[#2878D0]'
                        : 'bg-[#F4F8FD] text-[#172B45] border-[#D7E5F5]'
                    }`}
                  >
                    {t.actions[actionKey]}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
