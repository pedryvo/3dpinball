<div align="center">

# 3dpinball

**_3-D Ultra Pinball_（Dynamix / Sierra On-Line，1995）的逆向工程与现代 Web 移植版（TypeScript、HTML5 Canvas、WebAssembly 与 Web Audio API）**

[![TypeScript](https://img.shields.io/badge/typescript-5.5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![WebAssembly](https://img.shields.io/badge/webassembly-physics_core-654ff0?logo=webassembly&logoColor=white)](https://webassembly.org/)
[![Status](https://img.shields.io/badge/status-%E5%8F%AF%E6%B8%B8%E7%8E%A9-success)](#-开发进度)
[![Phase](https://img.shields.io/badge/phase-1_%E2%80%94_%E9%80%86%E5%90%91%E5%B7%A5%E7%A8%8B%E4%B8%8E%E5%9F%BA%E7%A1%80-blue)](docs/PLAN.md)
[![Platforms](https://img.shields.io/badge/platforms-Web_%7C_Vercel_%7C_Mobile-lightgrey)](#-运行游戏)
[![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0--or--later-blue)](LICENSE)

_1995 年 Dynamix / Sierra 太空基地经典弹珠台游戏，<br>经过逆向重构，可在任何现代浏览器、桌面电脑与智能手机上原生运行。_

[English](README.md) · [Português](README.pt-BR.md) · [Español](README.es.md) · [Deutsch](README.de.md) · **中文** · [Русский](README.ru.md)

</div>

---

## 🚀 关于项目

**3dpinball** 使用 **REA**（Reverse Engineer Anything）与 Ghidra 对原版 _3-D Ultra Pinball_ 可执行文件（`PINBALL.EXE`）、音频子系统（`SOS9502.DLL`）及资源包（`RESOURCE.MAP`、`RESOURCE.001`、`RESOURCE.002`）进行静态逆向分析，还原窗口过程（`@mainWndProc$qpvuiuil`、`@pinWndProc$qpvuiuil`）、Three-Space 2D/Z-Buffer 渲染器（`TS_DRAW.C`、`GFXDevWinG`）以及碰撞与样条物理系统（`PB_COL.C`、`PB_SPLIN.C`、`PB_FRAME.C`），打造纯净的现代 Web 原生移植版。

与笨重的 x86 模拟器不同，本移植版直接在 TypeScript、WebAssembly 和 HTML5 Canvas 中原生运行，**零模拟开销**：

- 🌐 **现代太空基地 Sci-Fi 与 Windows 95 界面**：经典的 Windows 95 窗口边框结合太空殖民地战术仪表盘（点阵 LED 计分板、倍率遥测、**殖民地（Colony）**、**指挥所（Command Post）** 与 **矿场（Mine）** 三张球台任务指示及无障碍 HTML5 菜单）。
- 📱 **移动端适配与触控支持**：专为智能手机与平板优化的响应式布局，配备屏幕左右挡板（Flippers）触控按键、弹簧发射器（Plunger）与撞击台面（Nudge/Tilt）按钮。
- 🎨 **像素级精准 256 色图形与 Z-Buffer**：基于原版 8 位调色板（`GFXPalette`、`GFXZBuffer`）实时解码 `.PAL`、`.BMP`、`.ANM` 与 `.ITF` 资源。
- ⚙️ **WebAssembly 刚体与样条物理核心**：高频子步长弹珠物理模拟、挡板角冲量、弹射器反弹、坡道样条（`PB_SPLIN.C`）与碰撞掩码（`PB_COL.C`）。
- 🔊 **Web Audio API 音效与合成音乐**：直接播放原版 PCM `.WAV` 音效与 FM/MIDI 合成背景音乐。
- 🌍 **完整的 6 语言本地化（i18n）**：自动识别用户系统语言（**巴西葡萄牙语**、**英语**、**西班牙语**、**俄语**、**简体中文**、**德语**），支持实时无缝切换。
- ⚡ **一键部署至 Vercel**：极速 Vite 构建，随时发布至 Vercel 等现代静态托管平台。

---

## 🎮 运行游戏

```bash
git clone https://github.com/pedryvo/3dpinball.git
cd 3dpinball
npm install
npm run dev
```

在浏览器中打开 `http://localhost:3000` 即可开始游玩！

---

## 🕹️ 操作说明

| 动作 | 桌面键盘 | 移动设备触控 |
|---|---|---|
| **左挡板（Left Flipper）** | `左 Shift` / `Z` / `左方向键` | ◀ **左挡板** 触控区 |
| **右挡板（Right Flipper）** | `右 Shift` / `/` / `右方向键` | **右挡板** ▶ 触控区 |
| **发射弹珠（Plunger）** | `空格键` / `Enter` / `下方向键` | 🚀 按住并松开 **发射** |
| **向左推台（Nudge Left）** | `X` 或 `A` | ↖ **左推** 按钮 |
| **向右推台（Nudge Right）** | `.` 或 `D` | ↗ **右推** 按钮 |
| **向上推台（Nudge Up）** | `上方向键` 或 `W` | ▲ **上推** 按钮 |
| **切换球台（殖民地 / 指挥所 / 矿场）** | `1`, `2`, `3` | 🎯 球台选择器 |
| **暂停游戏** | `P` / `Esc` | ⏸️ 暂停按钮 |
| **新游戏** | `F2` | 🎮 新游戏菜单 |

---

## ⚖️ 法律声明

_3-D Ultra Pinball_、Dynamix 与 Sierra On-Line 的商标及著作权归其各自所有者所有。本项目为非营利教育开源项目，源代码采用 [GNU General Public License v3.0 或更高版本](LICENSE) 授权。
