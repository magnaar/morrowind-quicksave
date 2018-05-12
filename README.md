# morrowind-quicksave
A simple executable to run beside Morrowind that allows you to keep several quick/backup saves.

Install:
  Put the binary (bin\quicksave.exe) in your Morrowind folder (where Morrowind.exe is).

Usage:
  Launch it each time you play Morrowind.

Configuration:
    In your Morrowind folder, after the first launch of the quicksave executable,
    you will have a quicksave.json.

    In that file, you can change how many saves you want to keep
    and how to show the ingame save name.

    For example:
        "autosave": {
            "name": "Auto {day}/{month}/{year} {hour}:{minute}",
            "max": 5
        }

        Means, your autosaves will be shown in game as "Auto 22/01/18 22:50", for example.
        and you can only have 5 autosaves at the same time, after that number, the oldest will be deleted.

    The time formats are as follow (for 2018/05/20 22:50:30 date time):
        {day}: 20
        {month}: 05
        {year}: 18
        {year-2}: 18
        {year-4}: 2018
        {hour}: 22
        {hour-12}: 10
        {hour-24}: 22
        {minute}: 55
        {second}: 30
        {meridiem}: PM
        {meridiem-1L}: p
        {meridiem-2L}: pm
        {meridiem-1U}: A
        {meridiem-2U}: AM
    
The ingame limit is at 31 characters
You will still have the usual quicksave.ess and autosave.ess present (to allow you to quick reload if you die).
You will find inside the Saves folder a backups folder (in case the ingame rename corrupt your save, but it's unlikely to happen)
(Anyway, your saves are saved twice)
When you reach the amount of saves you had fixed, the backup saves will be deleted too (like the other saves).