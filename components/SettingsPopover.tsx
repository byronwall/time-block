import { Button, Card, FormGroup, InputGroup, Switch } from "@blueprintjs/core";
import { Popover2 } from "@blueprintjs/popover2";
import { taskListAtom } from "../pages/blocks/[id]";
import { handleBooleanChange } from "./helpers";
import { useAtom } from "jotai";

type SettingsPopoverProps = {
  isColoredByPriority: boolean;
  onChange: (arg0: { isColoredByPriority: boolean }) => void;
  shouldScheduleAfterCurrent: boolean;
  setShouldScheduleAfterCurrent: (arg0: boolean) => void;
  dateToStr: (arg0: any) => string;
  startTime: any;
  endTime: any;
};

export function SettingsPopover(props: SettingsPopoverProps) {
  const {
    isColoredByPriority,
    onChange,
    shouldScheduleAfterCurrent,
    setShouldScheduleAfterCurrent,
    dateToStr,
    startTime,
    endTime,
  } = props;

  const [activeTaskList, setActiveTaskList] = useAtom(taskListAtom);

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
                  setActiveTaskList({
                    ...activeTaskList,
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
                  setActiveTaskList({
                    ...activeTaskList,
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
