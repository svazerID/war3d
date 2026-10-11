import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  GameMode,
  BotDifficulty,
  RocketTypeId,
  PlayerProfile,
  KillFeedItem,
  MatchStats,
} from './types/game';
import {
  loadPlayerProfile,
  savePlayerProfile,
  getXpRequiredForLevel,
  getUpgradeCost,
} from './storage/gameStorage';
import { GameEngine } from './game3d/GameEngine';
import { audioManager } from './sound/audioManager';
import { MainMenu } from './components/MainMenu';
import { GameHUD } from './components/GameHUD';
import { TwoPlayerHUD } from './components/TwoPlayerHUD';
import { ArmoryModal } from './components/ArmoryModal';
import { DailyMissionsModal } from './components/DailyMissionsModal';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { OfflineIndicator } from './pwa/OfflineIndicator';

export default function App() {
  const [profile, setProfile] = useState<PlayerProfile>(() => loadPlayerProfile());
  const [screen, setScreen] = useState<'menu' | 'playing'>('menu');
  const [selectedMode, setSelectedMode] = useState<GameMode>('solo_bots');
  const [selectedDifficulty, setSelectedDifficulty] = useState<BotDifficulty>('veteran');

  // Modals
  const [showArmory, setShowArmory] = useState(false);
  const [showMissions, setShowMissions] = useState(false);
  const [showPause, setShowPause] = useState(false);
  const [gameOverStats, setGameOverStats] = useState<{
    stats: MatchStats;
    coins: number;
    xp: number;
    levelUp: boolean;
    newLevel: number;
  } | null>(null);

  // In-Game Live HUD states
  const [p1Hp, setP1Hp] = useState(100);
  const [p1MaxHp, setP1MaxHp] = useState(100);
  const [p1Shield, setP1Shield] = useState(100);
  const [p1MaxShield, setP1MaxShield] = useState(100);

  const [p2Hp, setP2Hp] = useState(100);
  const [p2MaxHp, setP2MaxHp] = useState(100);
  const [p2Shield, setP2Shield] = useState(100);
  const [p2MaxShield, setP2MaxShield] = useState(100);

  const [score, setScore] = useState(0);
  const [kills, setKills] = useState(0);
  const [deaths, setDeaths] = useState(0);
  const [wave, setWave] = useState(1);
  const [equippedRocket, setEquippedRocket] = useState<RocketTypeId>('fast');
  const [killFeed, setKillFeed] = useState<KillFeedItem[]>([]);
  const [fireCooldown, setFireCooldown] = useState(0);
  const [dashCooldown, setDashCooldown] = useState(0);
  const [lockedTarget, setLockedTarget] = useState<{ name: string; dist: number } | null>(null);

  // Radar data
  const [playerPos, setPlayerPos] = useState({ x: 0, z: 0 });
  const [playerAngle, setPlayerAngle] = useState(0);
  const [botPositions, setBotPositions] = useState<{ x: number; z: number; isDead: boolean }[]>([]);
  const [pickupPositions, setPickupPositions] = useState<{ x: number; z: number; active: boolean; type: string }[]>([]);

  const gameContainerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Sync audioManager preferences
  useEffect(() => {
    audioManager.enabled = profile.soundEnabled;
    audioManager.hapticsEnabled = profile.hapticsEnabled;
  }, [profile.soundEnabled, profile.hapticsEnabled]);

  // Clean up engine when switching to menu
  const terminateGame = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.dispose();
      engineRef.current = null;
    }
    setShowPause(false);
  }, []);

  const handleStartGame = () => {
    setScreen('playing');
    setScore(0);
    setKills(0);
    setDeaths(0);
    setWave(1);
    setKillFeed([]);
    setGameOverStats(null);
    setShowPause(false);
  };

  // Launch 3D engine when screen becomes 'playing'
  useEffect(() => {
    if (screen !== 'playing' || !gameContainerRef.current) return;

    // Small delay to ensure container DOM layout is computed
    const timer = setTimeout(() => {
      if (!gameContainerRef.current) return;

      const engine = new GameEngine(
        gameContainerRef.current,
        selectedMode,
        selectedDifficulty,
        profile,
        {
          onScoreUpdate: (newScore, newKills, newDeaths) => {
            setScore(newScore);
            setKills(newKills);
            setDeaths(newDeaths);
          },
          onPlayerHpUpdate: (hp, maxHp, shield, maxShield) => {
            setP1Hp(hp);
            setP1MaxHp(maxHp);
            setP1Shield(shield);
            setP1MaxShield(maxShield);
          },
          onPlayer2HpUpdate: (hp, maxHp, shield, maxShield) => {
            setP2Hp(hp);
            setP2MaxHp(maxHp);
            setP2Shield(shield);
            setP2MaxShield(maxShield);
          },
          onKillFeed: (item) => {
            setKillFeed((prev) => [...prev.slice(-4), item]);
          },
          onGameOver: (stats) => {
            handleMatchFinished(stats);
          },
          onWaveComplete: (newWave) => {
            setWave(newWave);
          },
        }
      );

      engineRef.current = engine;
    }, 50);

    return () => {
      clearTimeout(timer);
      terminateGame();
    };
  }, [screen, selectedMode, selectedDifficulty]);

  // Radar & Cooldown Update Loop
  useEffect(() => {
    if (screen !== 'playing') return;

    const interval = setInterval(() => {
      const eng = engineRef.current;
      if (!eng || !eng.player1) return;

      setPlayerPos({ x: eng.player1.position.x, z: eng.player1.position.z });
      setPlayerAngle(eng.player1.rotationY);
      setFireCooldown(eng.player1.fireCooldowns[eng.player1.equippedWeapon] || 0);
      setDashCooldown(eng.player1.dashCooldown || 0);

      if (eng.player1.lockedTarget && !eng.player1.lockedTarget.isDead) {
        const dist = eng.player1.position.distanceTo(eng.player1.lockedTarget.position);
        setLockedTarget({
          name: eng.player1.lockedTarget.name,
          dist,
        });
      } else {
        setLockedTarget(null);
      }

      setBotPositions(
        eng.bots.map((b) => ({
          x: b.position.x,
          z: b.position.z,
          isDead: b.isDead,
        }))
      );

      setPickupPositions(
        eng.pickups.map((p) => ({
          x: p.position.x,
          z: p.position.z,
          active: p.active,
          type: p.type,
        }))
      );
    }, 100);

    return () => clearInterval(interval);
  }, [screen]);

  // Keyboard controls for desktop testing / fallback
  useEffect(() => {
    if (screen !== 'playing') return;

    const keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true;

      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        togglePause();
      }

      // 1, 2, 3 weapon switch
      if (e.key === '1') handleSwitchWeapon('fast');
      if (e.key === '2') handleSwitchWeapon('explosive');
      if (e.key === '3') handleSwitchWeapon('piercing');

      // Space / Shift
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        handleFireP1();
      }
      if (e.key === 'Shift' || e.code === 'ShiftLeft') {
        handleDashP1();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };

    const pollMovement = setInterval(() => {
      const eng = engineRef.current;
      if (!eng) return;

      let mx = 0;
      let my = 0;
      if (keys['w'] || keys['arrowup']) my -= 1;
      if (keys['s'] || keys['arrowdown']) my += 1;
      if (keys['a'] || keys['arrowleft']) mx -= 1;
      if (keys['d'] || keys['arrowright']) mx += 1;

      const hasKeyMovement = Boolean(
        keys['w'] || keys['s'] || keys['a'] || keys['d'] ||
        keys['arrowup'] || keys['arrowdown'] || keys['arrowleft'] || keys['arrowright']
      );

      // Only override if keyboard was actively pressed for movement
      if (hasKeyMovement) {
        eng.p1Input.moveX = mx;
        eng.p1Input.moveY = my;
      }
    }, 30);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      clearInterval(pollMovement);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [screen]);

  const handleMatchFinished = (stats: MatchStats) => {
    // Reward calculation
    const baseCoins = stats.won ? 120 : 40;
    const killBonus = stats.kills * 15;
    const earnedCoins = baseCoins + killBonus;

    const baseExp = stats.won ? 150 : 50;
    const killExp = stats.kills * 20;
    const earnedXp = baseExp + killExp;

    setProfile((prev) => {
      let newCoins = prev.coins + earnedCoins;
      let newXp = prev.xp + earnedXp;
      let newLevel = prev.level;
      let leveledUp = false;

      // Check level up
      let reqXp = getXpRequiredForLevel(newLevel);
      while (newXp >= reqXp) {
        newXp -= reqXp;
        newLevel++;
        leveledUp = true;
        reqXp = getXpRequiredForLevel(newLevel);
      }

      // Update Daily Missions Progress
      const updatedMissions = prev.missions.map((m) => {
        if (m.completed) return m;
        let prog = m.progress;

        if (m.type === 'kills') {
          prog += stats.kills;
        } else if (m.type === 'matches_played') {
          prog += 1;
        } else if (m.type === 'coop_victory' && stats.mode === 'coop_survival' && stats.won) {
          prog += 1;
        } else if (m.type === 'explosive_kills' && equippedRocket === 'explosive') {
          prog += stats.kills;
        } else if (m.type === 'piercing_kills' && equippedRocket === 'piercing') {
          prog += stats.kills;
        }

        const isComplete = prog >= m.target;
        return {
          ...m,
          progress: Math.min(m.target, prog),
          completed: isComplete,
        };
      });

      const updatedProfile: PlayerProfile = {
        ...prev,
        coins: newCoins,
        xp: newXp,
        level: newLevel,
        highScore: Math.max(prev.highScore, stats.score),
        totalKills: prev.totalKills + stats.kills,
        matchesPlayed: prev.matchesPlayed + 1,
        missions: updatedMissions,
      };

      savePlayerProfile(updatedProfile);

      setGameOverStats({
        stats,
        coins: earnedCoins,
        xp: earnedXp,
        levelUp: leveledUp,
        newLevel,
      });

      return updatedProfile;
    });
  };

  const handleJoystickMove = (vec: { x: number; y: number }) => {
    if (engineRef.current) {
      engineRef.current.p1Input.moveX = vec.x;
      engineRef.current.p1Input.moveY = vec.y;
    }
  };

  const handleP2JoystickMove = (vec: { x: number; y: number }) => {
    if (engineRef.current) {
      engineRef.current.p2Input.moveX = vec.x;
      engineRef.current.p2Input.moveY = vec.y;
    }
  };

  const handleFireP1 = (aimDir?: { x: number; y: number }) => {
    if (engineRef.current) {
      engineRef.current.fireP1(aimDir);
    }
  };

  const toggleCamera = () => {
    setProfile((prev) => {
      const nextMode: 'tactical' | 'follow' = prev.cameraMode === 'tactical' ? 'follow' : 'tactical';
      const updated: PlayerProfile = { ...prev, cameraMode: nextMode };
      savePlayerProfile(updated);
      if (engineRef.current) {
        engineRef.current.profile.cameraMode = nextMode;
        engineRef.current.player1.profile.cameraMode = nextMode;
      }
      return updated;
    });
  };

  const toggleAutoAim = () => {
    setProfile((prev) => {
      const next = !(prev.autoAimEnabled !== false);
      const updated: PlayerProfile = { ...prev, autoAimEnabled: next };
      savePlayerProfile(updated);
      if (engineRef.current) {
        engineRef.current.profile.autoAimEnabled = next;
        engineRef.current.player1.profile.autoAimEnabled = next;
      }
      return updated;
    });
  };

  const toggleSensitivity = () => {
    setProfile((prev) => {
      const nextSens: 'normal' | 'high' = prev.controlsSensitivity === 'normal' ? 'high' : 'normal';
      const updated: PlayerProfile = { ...prev, controlsSensitivity: nextSens };
      savePlayerProfile(updated);
      if (engineRef.current) {
        engineRef.current.profile.controlsSensitivity = nextSens;
        engineRef.current.player1.profile.controlsSensitivity = nextSens;
      }
      return updated;
    });
  };

  const toggleAutoFire = () => {
    setProfile((prev) => {
      const next = !prev.autoFireEnabled;
      const updated: PlayerProfile = { ...prev, autoFireEnabled: next };
      savePlayerProfile(updated);
      if (engineRef.current) {
        engineRef.current.profile.autoFireEnabled = next;
        engineRef.current.player1.profile.autoFireEnabled = next;
      }
      return updated;
    });
  };

  const toggleControlScheme = () => {
    setProfile((prev) => {
      const next: 'joystick' | 'dpad' = prev.controlScheme === 'dpad' ? 'joystick' : 'dpad';
      const updated: PlayerProfile = { ...prev, controlScheme: next };
      savePlayerProfile(updated);
      if (engineRef.current) {
        engineRef.current.profile.controlScheme = next;
        engineRef.current.player1.profile.controlScheme = next;
      }
      return updated;
    });
  };

  const toggleInvertY = () => {
    setProfile((prev) => {
      const next = !prev.invertY;
      const updated: PlayerProfile = { ...prev, invertY: next };
      savePlayerProfile(updated);
      if (engineRef.current) {
        engineRef.current.profile.invertY = next;
        engineRef.current.player1.profile.invertY = next;
      }
      return updated;
    });
  };

  const toggleInvertX = () => {
    setProfile((prev) => {
      const next = !prev.invertX;
      const updated: PlayerProfile = { ...prev, invertX: next };
      savePlayerProfile(updated);
      if (engineRef.current) {
        engineRef.current.profile.invertX = next;
        engineRef.current.player1.profile.invertX = next;
      }
      return updated;
    });
  };

  const handleFireP2 = () => {
    if (engineRef.current) {
      engineRef.current.fireP2();
    }
  };

  const handleDashP1 = () => {
    if (engineRef.current) {
      engineRef.current.triggerP1Dash();
    }
  };

  const handleDashP2 = () => {
    if (engineRef.current) {
      engineRef.current.triggerP2Dash();
    }
  };

  const handleSwitchWeapon = (w: RocketTypeId) => {
    setEquippedRocket(w);
    if (engineRef.current) {
      engineRef.current.switchP1Weapon(w);
    }
  };

  const togglePause = () => {
    setShowPause((prev) => {
      const next = !prev;
      if (engineRef.current) {
        engineRef.current.setPaused(next);
      }
      return next;
    });
  };

  const handleRestart = () => {
    terminateGame();
    handleStartGame();
  };

  const handleQuitToMenu = () => {
    terminateGame();
    setScreen('menu');
  };

  // Upgrades & Missions Handlers
  const handleUpgradeStat = (
    type: RocketTypeId,
    stat: 'damageLevel' | 'speedLevel' | 'radiusLevel' | 'cooldownLevel'
  ) => {
    const curLevel = profile.upgrades[type][stat];
    const cost = getUpgradeCost(curLevel);
    if (profile.coins < cost) return;

    setProfile((prev) => {
      const updated: PlayerProfile = {
        ...prev,
        coins: prev.coins - cost,
        upgrades: {
          ...prev.upgrades,
          [type]: {
            ...prev.upgrades[type],
            [stat]: curLevel + 1,
          },
        },
      };
      savePlayerProfile(updated);
      return updated;
    });
  };

  const handleUnlockSkin = (skinId: string, cost: number) => {
    if (profile.coins < cost) return;
    setProfile((prev) => {
      const updated: PlayerProfile = {
        ...prev,
        coins: prev.coins - cost,
        unlockedSkins: [...prev.unlockedSkins, skinId],
      };
      savePlayerProfile(updated);
      return updated;
    });
  };

  const handleEquipSkin = (type: RocketTypeId, skinId: string) => {
    setProfile((prev) => {
      const updated: PlayerProfile = {
        ...prev,
        equippedSkin: {
          ...prev.equippedSkin,
          [type]: skinId,
        },
      };
      savePlayerProfile(updated);
      return updated;
    });
  };

  const handleClaimMission = (missionId: string) => {
    setProfile((prev) => {
      const target = prev.missions.find((m) => m.id === missionId);
      if (!target || !target.completed || target.claimed) return prev;

      let newCoins = prev.coins + target.rewardCoins;
      let newXp = prev.xp + target.rewardXp;
      let newLevel = prev.level;
      let reqXp = getXpRequiredForLevel(newLevel);
      while (newXp >= reqXp) {
        newXp -= reqXp;
        newLevel++;
        reqXp = getXpRequiredForLevel(newLevel);
      }

      const updatedMissions = prev.missions.map((m) =>
        m.id === missionId ? { ...m, claimed: true } : m
      );

      const updated: PlayerProfile = {
        ...prev,
        coins: newCoins,
        xp: newXp,
        level: newLevel,
        missions: updatedMissions,
      };
      savePlayerProfile(updated);
      return updated;
    });
  };

  const toggleSound = () => {
    setProfile((prev) => {
      const updated = { ...prev, soundEnabled: !prev.soundEnabled };
      savePlayerProfile(updated);
      return updated;
    });
  };

  const toggleHaptics = () => {
    setProfile((prev) => {
      const updated = { ...prev, hapticsEnabled: !prev.hapticsEnabled };
      savePlayerProfile(updated);
      return updated;
    });
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#07090e]">
      {/* Offline Status Bar */}
      <OfflineIndicator />

      {/* 3D Game Canvas Container */}
      <div
        ref={gameContainerRef}
        className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
          screen === 'playing' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Main Menu Screen */}
      {screen === 'menu' && (
        <MainMenu
          profile={profile}
          selectedMode={selectedMode}
          selectedDifficulty={selectedDifficulty}
          onSelectMode={setSelectedMode}
          onSelectDifficulty={setSelectedDifficulty}
          onStartGame={handleStartGame}
          onOpenArmory={() => setShowArmory(true)}
          onOpenMissions={() => setShowMissions(true)}
          onToggleSound={toggleSound}
          onToggleHaptics={toggleHaptics}
        />
      )}

      {/* In-Game HUD (Solo Bots) */}
      {screen === 'playing' && selectedMode === 'solo_bots' && (
        <GameHUD
          score={score}
          kills={kills}
          deaths={deaths}
          wave={wave}
          mode={selectedMode}
          p1Hp={p1Hp}
          p1MaxHp={p1MaxHp}
          p1Shield={p1Shield}
          p1MaxShield={p1MaxShield}
          equippedRocket={equippedRocket}
          onSwitchRocket={handleSwitchWeapon}
          onFire={handleFireP1}
          onDash={handleDashP1}
          onJoystickMove={handleJoystickMove}
          onPause={togglePause}
          cameraMode={profile.cameraMode || 'tactical'}
          onToggleCamera={toggleCamera}
          autoFireEnabled={profile.autoFireEnabled}
          onToggleAutoFire={toggleAutoFire}
          controlScheme={profile.controlScheme || 'joystick'}
          onToggleControlScheme={toggleControlScheme}
          invertY={profile.invertY}
          onToggleInvertY={toggleInvertY}
          lockedTarget={lockedTarget}
          killFeed={killFeed}
          fireCooldown={fireCooldown}
          dashCooldown={dashCooldown}
          playerPos={playerPos}
          playerAngle={playerAngle}
          botPositions={botPositions}
          pickupPositions={pickupPositions}
        />
      )}

      {/* In-Game HUD (Co-op 2-Player or 2P Duel) */}
      {screen === 'playing' && (selectedMode === 'coop_survival' || selectedMode === 'duel_pvp') && (
        <TwoPlayerHUD
          mode={selectedMode}
          p1Score={score}
          p1Kills={kills}
          p1Hp={p1Hp}
          p1MaxHp={p1MaxHp}
          p1Shield={p1Shield}
          p1MaxShield={p1MaxShield}
          p2Hp={p2Hp}
          p2MaxHp={p2MaxHp}
          p2Shield={p2Shield}
          p2MaxShield={p2MaxShield}
          wave={wave}
          onP1Move={handleJoystickMove}
          onP2Move={handleP2JoystickMove}
          onP1Fire={handleFireP1}
          onP2Fire={handleFireP2}
          onP1Dash={handleDashP1}
          onP2Dash={handleDashP2}
          onPause={togglePause}
          killFeed={killFeed}
        />
      )}

      {/* Armory & Skins Modal */}
      {showArmory && (
        <ArmoryModal
          profile={profile}
          onClose={() => setShowArmory(false)}
          onUpgrade={handleUpgradeStat}
          onUnlockSkin={handleUnlockSkin}
          onEquipSkin={handleEquipSkin}
        />
      )}

      {/* Daily Missions Modal */}
      {showMissions && (
        <DailyMissionsModal
          profile={profile}
          onClose={() => setShowMissions(false)}
          onClaimMission={handleClaimMission}
        />
      )}

      {/* Pause Menu Modal */}
      {showPause && (
        <PauseModal
          profile={profile}
          onResume={togglePause}
          onRestart={handleRestart}
          onQuit={handleQuitToMenu}
          onToggleSound={toggleSound}
          onToggleHaptics={toggleHaptics}
          onToggleCamera={toggleCamera}
          onToggleAutoAim={toggleAutoAim}
          onToggleAutoFire={toggleAutoFire}
          onToggleControlScheme={toggleControlScheme}
          onToggleSensitivity={toggleSensitivity}
          onToggleInvertY={toggleInvertY}
          onToggleInvertX={toggleInvertX}
        />
      )}

      {/* Game Over Modal */}
      {gameOverStats && (
        <GameOverModal
          stats={gameOverStats.stats}
          earnedCoins={gameOverStats.coins}
          earnedXp={gameOverStats.xp}
          levelUp={gameOverStats.levelUp}
          newLevel={gameOverStats.newLevel}
          onRestart={handleRestart}
          onQuit={handleQuitToMenu}
        />
      )}
    </div>
  );
}
