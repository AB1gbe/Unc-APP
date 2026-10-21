@echo off
rem Type "pull" in this folder (Command Prompt). See docs/Setup/Pull and Push.md
node "%~dp0scripts\git-helper.mjs" pull %*
