import { useCallback, useEffect, useState } from "react";
import { createContextHook } from "./createContextHook";

// 游戏武器类型定义
type Weapon = {
	id: number;
	name: string;
	damage: number;
	icon: string;
};

const WEAPONS: Weapon[] = [
	{ id: 0, name: "剑", damage: 50, icon: "⚔️" },
	{ id: 1, name: "弓", damage: 35, icon: "🏹" },
	{ id: 2, name: "法杖", damage: 70, icon: "🪄" },
	{ id: 3, name: "匕首", damage: 25, icon: "🗡️" },
];

// 🎮 1. 武器切换系统
export const [WeaponProvider, useWeapon] = createContextHook(() => {
	const [currentWeaponId, setCurrentWeaponId] = useState(0);
	const [lastUsed, setLastUsed] = useState<number[]>([]);

	useEffect(() => {
		const handleKeyPress = (e: KeyboardEvent) => {
			// 数字键 1-4 切换武器
			const weaponKeys = ["Digit1", "Digit2", "Digit3", "Digit4"];
			const keyIndex = weaponKeys.indexOf(e.code);

			if (keyIndex !== -1 && keyIndex < WEAPONS.length) {
				e.preventDefault();
				setCurrentWeaponId(keyIndex);
				setLastUsed((prev) =>
					[keyIndex, ...prev.filter((id) => id !== keyIndex)].slice(0, 3),
				);
			}

			// Tab 键切换到上一个武器
			if (e.code === "Tab") {
				e.preventDefault();
				setCurrentWeaponId((prev) => (prev + 1) % WEAPONS.length);
			}
		};

		document.addEventListener("keydown", handleKeyPress);
		return () => document.removeEventListener("keydown", handleKeyPress);
	}, []);

	const currentWeapon = WEAPONS[currentWeaponId];
	const selectWeapon = useCallback((id: number) => {
		if (id >= 0 && id < WEAPONS.length) {
			setCurrentWeaponId(id);
		}
	}, []);

	return {
		currentWeapon,
		currentWeaponId,
		weapons: WEAPONS,
		selectWeapon,
		lastUsed,
	};
});

// 🎯 2. 游戏菜单和对话框系统
export const [GameUIProvider, useGameUI] = createContextHook(() => {
	const [menuOpen, setMenuOpen] = useState(false);
	const [inventoryOpen, setInventoryOpen] = useState(false);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [currentDialog, setCurrentDialog] = useState<string>("");

	useEffect(() => {
		const handleKeyPress = (e: KeyboardEvent) => {
			switch (e.code) {
				case "Escape":
					e.preventDefault();
					// ESC 关闭所有窗口或打开主菜单
					if (inventoryOpen || dialogOpen) {
						setInventoryOpen(false);
						setDialogOpen(false);
					} else {
						setMenuOpen((prev) => !prev);
					}
					break;

				case "KeyI":
					e.preventDefault();
					setInventoryOpen((prev) => !prev);
					break;

				case "KeyM":
					e.preventDefault();
					setMenuOpen((prev) => !prev);
					break;

				case "Enter":
					if (dialogOpen) {
						e.preventDefault();
						setDialogOpen(false);
						setCurrentDialog("");
					}
					break;
			}
		};

		document.addEventListener("keydown", handleKeyPress);
		return () => document.removeEventListener("keydown", handleKeyPress);
	}, [inventoryOpen, dialogOpen]);

	const showDialog = useCallback((text: string) => {
		setCurrentDialog(text);
		setDialogOpen(true);
	}, []);

	const closeAllWindows = useCallback(() => {
		setMenuOpen(false);
		setInventoryOpen(false);
		setDialogOpen(false);
		setCurrentDialog("");
	}, []);

	return {
		menuOpen,
		inventoryOpen,
		dialogOpen,
		currentDialog,
		setMenuOpen,
		setInventoryOpen,
		showDialog,
		closeAllWindows,
	};
});

// ⚡ 3. 游戏技能快捷键系统
type Skill = {
	id: string;
	name: string;
	cooldown: number;
	icon: string;
	key: string;
};

const SKILLS: Skill[] = [
	{ id: "fireball", name: "火球术", cooldown: 3000, icon: "🔥", key: "KeyQ" },
	{ id: "heal", name: "治疗术", cooldown: 5000, icon: "💚", key: "KeyE" },
	{ id: "shield", name: "护盾", cooldown: 8000, icon: "🛡️", key: "KeyR" },
	{ id: "teleport", name: "传送", cooldown: 10000, icon: "✨", key: "KeyF" },
];

export const [SkillProvider, useSkills] = createContextHook(() => {
	const [cooldowns, setCooldowns] = useState<Record<string, number>>({});

	const isOnCooldown = useCallback(
		(skillId: string) => {
			return cooldowns[skillId] && cooldowns[skillId] > Date.now();
		},
		[cooldowns],
	);

	const useSkill = useCallback(
		(skillId: string) => {
			if (isOnCooldown(skillId)) return false;

			const skill = SKILLS.find((s) => s.id === skillId);
			if (!skill) return false;

			// 设置冷却时间
			setCooldowns((prev) => ({
				...prev,
				[skillId]: Date.now() + skill.cooldown,
			}));
			return true;
		},
		[isOnCooldown],
	);

	useEffect(() => {
		const handleKeyPress = (e: KeyboardEvent) => {
			const skill = SKILLS.find((s) => s.key === e.code);
			if (skill) {
				e.preventDefault();
				useSkill(skill.id);
			}
		};

		document.addEventListener("keydown", handleKeyPress);
		return () => document.removeEventListener("keydown", handleKeyPress);
	}, [useSkill]);

	return {
		skills: SKILLS,
		cooldowns,
		isOnCooldown,
		useSkill,
	};
});

// 🎮 4. 游戏设置和控制系统
export const [GameSettingsProvider, useGameSettings] = createContextHook(() => {
	const [volume, setVolume] = useState(100);
	const [graphics, setGraphics] = useState<"low" | "medium" | "high">("medium");
	const [showFPS, setShowFPS] = useState(false);
	const [godMode, setGodMode] = useState(false);

	useEffect(() => {
		const handleKeyPress = (e: KeyboardEvent) => {
			// 调试快捷键
			if (e.ctrlKey && e.shiftKey) {
				switch (e.code) {
					case "KeyF":
						e.preventDefault();
						setShowFPS((prev) => !prev);
						break;
					case "KeyG":
						e.preventDefault();
						setGodMode((prev) => !prev);
						break;
				}
			}

			// 音量控制
			if (e.ctrlKey) {
				switch (e.code) {
					case "ArrowUp":
						e.preventDefault();
						setVolume((prev) => Math.min(100, prev + 10));
						break;
					case "ArrowDown":
						e.preventDefault();
						setVolume((prev) => Math.max(0, prev - 10));
						break;
				}
			}
		};

		document.addEventListener("keydown", handleKeyPress);
		return () => document.removeEventListener("keydown", handleKeyPress);
	}, []);

	return {
		volume,
		graphics,
		showFPS,
		godMode,
		setVolume,
		setGraphics,
		setShowFPS,
		setGodMode,
	};
});

// 📱 使用示例组件
export function GameApp() {
	return (
		<GameSettingsProvider>
			<GameUIProvider>
				<WeaponProvider>
					<SkillProvider>
						<div className="game-container">
							<GameHUD />
							<GameWorld />
						</div>
					</SkillProvider>
				</WeaponProvider>
			</GameUIProvider>
		</GameSettingsProvider>
	);
}

function GameHUD() {
	const { currentWeapon } = useWeapon();
	const { skills, isOnCooldown } = useSkills();
	const { volume, showFPS } = useGameSettings();

	return (
		<div className="game-hud">
			<div className="weapon-display">
				当前武器: {currentWeapon.icon} {currentWeapon.name}
			</div>

			<div className="skills-bar">
				{skills.map((skill) => (
					<div
						key={skill.id}
						className={`skill ${isOnCooldown(skill.id) ? "cooldown" : ""}`}
					>
						{skill.icon}
					</div>
				))}
			</div>

			{showFPS && <div className="fps-counter">FPS: 60</div>}
			<div className="volume">🔊 {volume}%</div>
		</div>
	);
}

function GameWorld() {
	const { menuOpen, inventoryOpen, dialogOpen, currentDialog } = useGameUI();

	return (
		<div className="game-world">
			<div className="game-scene">
				{/* 游戏场景内容 */}
				<p>游戏世界 - 使用快捷键控制游戏!</p>
				<div className="controls-help">
					<h3>控制说明:</h3>
					<ul>
						<li>1-4: 切换武器</li>
						<li>Q/E/R/F: 使用技能</li>
						<li>I: 背包</li>
						<li>ESC: 菜单</li>
						<li>Ctrl+↑/↓: 音量</li>
						<li>Ctrl+Shift+F: FPS显示</li>
					</ul>
				</div>
			</div>

			{menuOpen && (
				<div className="game-menu">
					<h2>游戏菜单</h2>
					<button>继续游戏</button>
					<button>保存游戏</button>
					<button>设置</button>
					<button>退出</button>
				</div>
			)}

			{inventoryOpen && (
				<div className="inventory">
					<h2>背包</h2>
					<div className="inventory-grid">{/* 背包物品 */}</div>
				</div>
			)}

			{dialogOpen && (
				<div className="dialog-box">
					<p>{currentDialog}</p>
					<div className="dialog-controls">按回车继续...</div>
				</div>
			)}
		</div>
	);
}
