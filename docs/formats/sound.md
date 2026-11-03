# Audio Subsystem Specification (`SOS9502.DLL` & `RESOURCE.002`)

Derived from static analysis of `PINBALL.EXE` (`ev_f026cc1af44e5009f57a057d21ee83f239460d3de2ef5b49926648014485a8cc`) and `RESOURCE.002`.

## 1. HMI Sound Operating System (`SOS9502.DLL`)

`PINBALL.EXE` dynamically loads `SOS9502.DLL` (or `SOS32S02.DLL` on Win32s) and imports 63 functions via `GetProcAddress`:
- **Digital PCM Mixing (`sosDIGI*`)**: `sosDIGIInitSystem`, `sosDIGIInitDriver`, `sosDIGIStartSample`, `sosDIGIStopSample`, `sosDIGISetSampleVolume`, `sosDIGISetPanLocation`, `sosDIGISamplesPlaying`.
- **MIDI Sequencer (`sosMIDI*`)**: `sosMIDIInitSystem`, `sosMIDIInitSong`, `sosMIDIStartSong`, `sosMIDIStopSong`, `sosMIDISetMasterVolume`, using OPL2/OPL3 instrument banks `MELODIC.BNK` and `DRUM.BNK`.
- **High-Resolution Timer (`sosTIMER*`)**: `sosTIMERInitSystem`, `sosTIMERRegisterEvent`, `sosTIMERRemoveEvent`.

## 2. Sound Effects in `RESOURCE.002`

`RESOURCE.002` contains 198 standard RIFF `WAVE` PCM files (`11025 Hz`, 8-bit unsigned mono PCM) and 24 `HMI-MIDI` music tracks (`SX_1000.MID`–`SX_1999.MID`).
Key gameplay SFX extracted to `public/sfx/`:
- `FLIPPER.WAV`: Flipper solenoid actuation
- `KACHUNK1.WAV`–`KACHUNK9.WAV`: Kickers, ball locks, and plunger launch
- `ZAP1.WAV`–`ZAP4.WAV`, `ELEC1.WAV`–`ELEC4.WAV`: Sci-fi bumper and laser hits
- `EXPLO1.WAV`–`EXPLO3.WAV`, `FIRE1.WAV`, `ROCKET1.WAV`: Thruster and mine explosions
- `CRYSTAL1.WAV`, `SCORE1.WAV`–`SCORE10.WAV`: Target & crystal scoring chimes
- `ROLL1.WAV`, `WHOOSH1.WAV`–`WHOOSH5.WAV`: Ramp and orbit habitrail rollovers
- `FANFARE1.WAV`–`FANFARE4.WAV`, `VICTORY1.WAV`: Challenge completion & jackpot fanfares
- `LOSE1.WAV`, `LOSE2.WAV`, `OOPS1.WAV`: Ball drain & Tilt penalties
