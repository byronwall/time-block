import { Button, Card, FormGroup, InputGroup, Switch } from "@blueprintjs/core";
import { Popover2 } from "@blueprintjs/popover2";
import { useTaskStore } from "../model/TaskStore";
import { handleBooleanChange } from "./helpers";

type SettingsPopoverProps = {
  isColoredByPriority: boolean;
  onChange: (arg0: { isColoredByPriority: boolean }) => void;
  shouldScheduleAfterCurrent: boolean;
  setShouldScheduleAfterCurrent: (arg0: boolean) => void;
  dateToStr: (arg0: any) => string;
};

export function SettingsPopover(props: SettingsPopoverProps) {
  const {
    isColoredByPriority,
    onChange,
    shouldScheduleAfterCurrent,
    setShouldScheduleAfterCurrent,
    dateToStr,
  } = props;

  const updateTaskList = useTaskStore((state) => state.updateTaskListPartial);

  const startTime = useTaskStore((state) => state.dateStart)();
  const endTime = useTaskStore((state) => state.dateEnd)();

  return (
    <Popover2
      content={
        <Card>
          <Switch
            label="color by priority"
            checked={isColoredByPriority}
            onChange={handleBooleanChange((isColoredByPriority) =>
              onChange({
                isColoredByPriority,
              })
            )}
          />
          <Switch
            label="schedule after current"
            checked={shouldScheduleAfterCurrent}
            onChange={handleBooleanChange((shouldScheduleAfterCurrent) =>
              setShouldScheduleAfterCurrent(shouldScheduleAfterCurrent)
            )}
          />

          <div
            style={{
              display: "flex",
              gap: 10,
            }}
          >
            <FormGroup inline label="start time">
              <InputGroup
                defaultValue={dateToStr(startTime)}
                onBlur={(e) => {
                  updateTaskList({
                    viewStart: e.target.value,
                  });
                }}
              />
            </FormGroup>
          </div>
          <div>
            <FormGroup inline label="end time">
              <InputGroup
                defaultValue={dateToStr(endTime)}
                onBlur={(e) => {
                  updateTaskList({
                    viewEnd: e.target.value,
                  });
                }}
              />
            </FormGroup>
          </div>
        </Card>
      }
    >
      <Button icon="cog" rightIcon="chevron-down" />
    </Popover2>
  );
}
