import { Button, Card, FormGroup, InputGroup, Switch } from "@blueprintjs/core";
import { Popover2 } from "@blueprintjs/popover2";
import { handleBooleanChange } from "./helpers";

type SettingsPopoverProps = {
  isColoredByPriority: boolean;
  onChange: (arg0: { isColoredByPriority: boolean }) => void;
  shouldScheduleAfterCurrent: boolean;
  setShouldScheduleAfterCurrent: (arg0: boolean) => void;
  dateToStr: (arg0: any) => string;
  startTime: any;
  setActiveTaskList: (arg0: { viewStart?: string; viewEnd?: string }) => void;
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
    setActiveTaskList,
    endTime,
  } = props;

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
