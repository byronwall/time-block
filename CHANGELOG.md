# Time Block changelog

## 0.0.15 -- 2022-09-12 23:13:43

- Remove `jotai`; move to `zustand` + `immer` for global store
  - This makes it much easier to update things where needed
- Rework various components to use the new global store

## 0.0.14 -- 2022-08-31 22:13:51

- Rework the task saving so that they're flat and days are handled separately
- Almost working again after removing the days and dealing with re-renders
- Switch to `jotai` for state management - let's see what happens...
  - Not sure this is any better... it works though

## 0.0.13 -- 2022-08-29 23:08:31

- Ensure that `preventDefault` is used when editing a task - prevent `e` from being typed
- Refactor some code to prepare for multiple days
- Support multiple days in the main view
- Remove animation from search popup
- Create an initial mutli-day view
  - Not the best setup at the moment
  - Should probably use a flat list of tasks and sort out the day assignment based on start date
  - Need to handle dragging between days

## 0.0.12 -- 2022-08-29 23:08:31

- Allow for searching via the `shift + s` shortcut

## 0.0.11 -- 2022-08-25 22:26:06

- Use Blueprint `useHotKey` which gives an overlay for free
- Prevent frozen or complete tasks from being auto scheduled
- Force schedule to take place after current time
- Allow new task to be unscheduled if holding meta key

## 0.0.10 -- 2022-08-24 23:09:39

- Have a default priority -- includes a new migration layer
- Refactor some types into the models file
- Allow the display start and end time to save with the task list
- Show a bar for current time

## 0.0.9 -- 2022-08-22 22:07:24

- Do a default color in the schedule
- Resolve time issue UTC vs. local
- Allow the completion status to change the color
- Add support for frozen tasks which cannot move automatically - dashed border + `f`
- Allow blocks to be auto scheduled to remove gaps - this will skip over frozen blocks - `shift + r`
- Add an over-scroll margin

## 0.0.8 -- 2022-08-21 22:42:50

- Move all action buttons to keyboard shortcuts
- Change styling so that text does not overflow the down arrow
- Allow the unscheduled tasks to wrap at the top
- Slight tweaks to visuals
- Force text color to give good contrast against background
- Track a dirty status on the list and then show the `save all` button

## 0.0.7 -- 2022-08-20 23:05:58

- Add a popup to quickly edit details - uses a set of buttons for duration and priority

## 0.0.6 -- 2022-08-20 13:35:24

- Add color for priority and a setting to color by priority
- Add keyboard shortcuts to quickly set the priority
- Start to warn on props destructure

## 0.0.5 -- 2022-07-09 11:01:23

- Move to route based task list loading
- Task editing details are stored on the specific route now
- Add a function to get single task list details

## 0.0.4 -- 2022-05-29 00:21:38

- Ensure Blueprint has all needed packages and CSS

## 0.0.3 -- 2022-05-28 22:59:59

- Allow for unscheduled tasks
- Allow the time block info to be saved to DB
- Change to storing dates as timestamps to avoid JSON problems

## 0.0.2 -- 2022-05-24 23:00:24

- Working out support for time block view with dragging
  - Using d3 to handle all of the time formatting and parsing
  - Allow this view to create multiple columns on overlap
- Add support for editing and deleting tasks

## 0.0.1 -- 2022-05-21 23:04:27

- Initial version that supports a task list and basic list
