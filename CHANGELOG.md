# Time Block changelog

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
