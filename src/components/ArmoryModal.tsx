import React, { useState } from 'react';
import { PlayerProfile, RocketTypeId } from '../types/game';
import { ROCKET_CONFIGS, AVAILABLE_SKINS, getUpgradeCost, getUpgradedRocketStats } from '../storage/gameStorage';
import { X, Zap, Bomb, Flame, Coins, ShieldCheck, Check } from 'lucide-react';
import { audioManager } from '../sound/audioManager';

interface ArmoryModalProps {
  profile: PlayerProfile;
  onClose: () => void;
  onUpgrade: (type: RocketTypeId, stat: 'damageLevel' | 'speedLevel' | 'radiusLevel' | 'cooldownLevel') => void;
  onUnlockSkin: (skinId: string, cost: number) => void;
  onEquipSkin: (type: RocketTypeId, skinId: string) => void;
}

export const ArmoryModal: React.FC<ArmoryModalProps> = ({
  profile,
  onClose,
  onUpgrade,
  onUnlockSkin,
  onEquipSkin,
}) => {
  const [activeTab, setActiveTab] = useState<'upgrades' | 'skins'>('upgrades');
  const [selectedRocket, setSelectedRocket] = useState<RocketTypeId>('fast');

  const baseConfig = ROCKET_CONFIGS[selectedRocket];
  const currentUpgrades = profile.upgrades[selectedRocket];
  const upgradedStats = getUpgradedRocketStats(baseConfig, currentUpgrades);

  const statTracks = [
    { key: 'damageLevel' as const, label: 'Damage', currentVal: upgradedStats.baseDamage, unit: 'pts' },
    { key: 'speedLevel' as const, label: 'Kecepatan', currentVal: upgradedStats.speed, unit: 'm/s' },
    { key: 'radiusLevel' as const, label: 'Radius Ledakan', currentVal: upgradedStats.radius, unit: 'm' },
    { key: 'cooldownLevel' as const, label: 'Kecepatan Reload', currentVal: upgradedStats.cooldown, unit: 's' },
  ];

  const handleUpgradeClick = (statKey: 'damageLevel' | 'speedLevel' | 'radiusLevel' | 'cooldownLevel') => {
    const curLevel = currentUpgrades[statKey];
    if (curLevel >= 5) return;
    const cost = getUpgradeCost(curLevel);
    if (profile.coins >= cost) {
      audioManager.playPickup();
      onUpgrade(selectedRocket, statKey);
    }
  };

  const currentSkins = AVAILABLE_SKINS.filter((s) => s.rocketType === selectedRocket);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[90dvh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-black text-white">GUDANG SENJATA & SKIN</h2>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-950 border border-amber-500/40 rounded-full text-xs font-bold text-amber-300">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>{profile.coins}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab & Rocket Switcher */}
        <div className="flex flex-col gap-2 p-4 bg-slate-950/60 border-b border-slate-800">
          {/* Main Tabs */}
          <div className="flex items-center gap-2 self-center">
            <button
              onClick={() => setActiveTab('upgrades')}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
                activeTab === 'upgrades'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              UPGRADE SENJATA
            </button>
            <button
              onClick={() => setActiveTab('skins')}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
                activeTab === 'skins'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              KOLEKSI SKIN
            </button>
          </div>

          {/* Rocket Selector */}
          <div className="grid grid-cols-3 gap-2 mt-2">
            {(['fast', 'explosive', 'piercing'] as RocketTypeId[]).map((type) => {
              const cfg = ROCKET_CONFIGS[type];
              const isSelected = selectedRocket === type;

              return (
                <button
                  key={type}
                  onClick={() => setSelectedRocket(type)}
                  className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-950/40 shadow'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-black text-white">{cfg.name}</span>
                  <span className="text-[10px] text-slate-400">{cfg.nameId}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Weapon Description Banner */}
          <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800 text-xs text-slate-300">
            {baseConfig.description}
          </div>

          {activeTab === 'upgrades' ? (
            /* Upgrade Tracks */
            <div className="space-y-3">
              {statTracks.map((stat) => {
                const curLevel = currentUpgrades[stat.key];
                const isMax = curLevel >= 5;
                const cost = getUpgradeCost(curLevel);
                const canAfford = profile.coins >= cost;

                return (
                  <div
                    key={stat.key}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60"
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-white">{stat.label}</span>
                        <span className="text-xs font-mono font-bold text-cyan-400">
                          {stat.currentVal} {stat.unit}
                        </span>
                      </div>
                      {/* 5-bar progress dots */}
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <div
                            key={lvl}
                            className={`h-2 flex-1 rounded-full transition-colors ${
                              lvl <= curLevel ? 'bg-cyan-400 shadow-sm shadow-cyan-400' : 'bg-slate-950'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Upgrade Action Button */}
                    <button
                      onClick={() => handleUpgradeClick(stat.key)}
                      disabled={isMax || !canAfford}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 whitespace-nowrap ${
                        isMax
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : canAfford
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:brightness-110'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {isMax ? (
                        <span>MAKSIMAL</span>
                      ) : (
                        <>
                          <span>UPGRADE</span>
                          <span className="font-mono text-amber-300 flex items-center gap-0.5">
                            <Coins className="w-3 h-3 text-amber-400" />
                            {cost}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Skins List */
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {currentSkins.map((skin) => {
                const isUnlocked = profile.unlockedSkins.includes(skin.id);
                const isEquipped = profile.equippedSkin[selectedRocket] === skin.id;
                const canBuy = profile.coins >= skin.cost;

                return (
                  <div
                    key={skin.id}
                    className={`flex flex-col items-center p-3.5 rounded-2xl border transition-all text-center ${
                      isEquipped
                        ? 'border-cyan-400 bg-cyan-950/40 shadow-lg'
                        : 'border-slate-800 bg-slate-800/40'
                    }`}
                  >
                    {/* Skin Color Palette Preview */}
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center border-2 border-slate-700 shadow-md mb-2 relative overflow-hidden">
                      <div style={{ backgroundColor: skin.color }} className="w-full h-full" />
                      <div
                        style={{ backgroundColor: skin.accentColor }}
                        className="absolute bottom-0 right-0 w-6 h-6 rounded-tl-xl border-t border-l border-white/40"
                      />
                    </div>

                    <span className="text-xs font-black text-white">{skin.name}</span>

                    {/* Action */}
                    <div className="mt-3 w-full">
                      {isEquipped ? (
                        <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-cyan-400">
                          <Check className="w-3.5 h-3.5" />
                          <span>TERPASANG</span>
                        </div>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => onEquipSkin(selectedRocket, skin.id)}
                          className="w-full py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all"
                        >
                          PASANG
                        </button>
                      ) : (
                        <button
                          onClick={() => onUnlockSkin(skin.id, skin.cost)}
                          disabled={!canBuy}
                          className={`w-full py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                            canBuy
                              ? 'bg-amber-600 hover:bg-amber-500 text-white'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          <Coins className="w-3 h-3 text-amber-300" />
                          <span>{skin.cost}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
