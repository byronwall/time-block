import {
  Button,
  Card,
  EditableText,
  FormGroup,
  H2,
  InputGroup,
  Switch,
} from "@blueprintjs/core";
import { Popover2 } from "@blueprintjs/popover2";
import { scaleOrdinal, utcFormat, utcParse } from "d3";
import { isEqual } from "lodash-es";
import { useCallback, useEffect, useState } from "react";
import { useSetState } from "react-use";

import { handleBooleanChange } from "../../components/helpers";
import {
  ColorSansHandler,
  TaskColorContext,
} from "../../components/TaskColorContext";
import { TimeBlockDay } from "../../components/TimeBlockDay";
import { TaskList, TimeBlockEntry } from "../../model/model";
import { findOneTaskList } from "../../util/db";
import { quickPost } from "../../util/quickPost";

interface TimeBlockViewProps {
  activeTaskList: TaskList;
}

export default function TimeBlockView(props: TimeBlockViewProps) {
  // store the active list in state too
  const [activeTaskList, setActiveTaskList] = useSetState(props.activeTaskList);

  const isDirty = !isEqual(activeTaskList, props.activeTaskList);

  // store the color provider state here
  const [colorContext, setColorContext] = useState<ColorSansHandler>({
    getColorFromPriority: (priority: number) => {
      const scale = scaleOrdinal<number, string>()
        .domain([1, 2, 3, 4, 5])
        .range(["#D61E29", "#FDBB30", "#FEE08B", "#D9EF8B", "#A6D96A"]);
      return scale(priority);
    },
    isColoredByPriority: true,
  });

  const onChange = useCallback(
    (data: Partial<TaskColorContext>) =>
      setColorContext({ ...colorContext, ...data }),
    [colorContext]
  );

  const handleSaveTaskList = async () => {
    await quickPost("/api/insertTaskList", activeTaskList);
  };

  const handleNewTaskList = (entries: TimeBlockEntry[]) => {
    setActiveTaskList({ timeBlockEntries: entries });
  };

  const handleTaskListNameChange = (name: string) => {
    setActiveTaskList({ name });
  };

  // store a string for start time in state
  const parser = utcParse("%H:%M");
  const dateToStr = utcFormat("%H:%M");

  const startTime = parser(activeTaskList.viewStart);
  const endTime = parser(activeTaskList.viewEnd);

  useEffect(() => {
    // bind a key press handler to the document to detect key press without focus
    function handleKeyDown(e: KeyboardEvent) {
      // check if target is an input or textarea
      const isTargetInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement;

      if (isTargetInput) {
        return;
      }

      if (e.key === "C") {
        onChange({ isColoredByPriority: !colorContext.isColoredByPriority });
        return;
      }

      if (e.key === "R") {
        // update tasks after call to rebalance
        const newEntries = getTImeBlocksWithoutOverlap(
          activeTaskList.timeBlockEntries,
          +startTime
        );

        setActiveTaskList({ timeBlockEntries: newEntries });
      }

      console.log("unhandled key press", e.key);
    }

    document.addEventListener("keydown", handleKeyDown);

    return function cleanup() {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    onChange,
    colorContext.isColoredByPriority,
    activeTaskList,
    startTime,
    setActiveTaskList,
  ]);

  return (
    <>
      <H2>
        <EditableText
          onChange={handleTaskListNameChange}
          value={activeTaskList.name}
        />
      </H2>

      {isDirty && <Button text="save all" onClick={handleSaveTaskList} />}

      <Popover2
        content={
          <Card>
            <Switch
              label="color by priority"
              checked={colorContext.isColoredByPriority}
              onChange={handleBooleanChange((isColoredByPriority) =>
                onChange({ isColoredByPriority })
              )}
            />

            <div style={{ display: "flex", gap: 10 }}>
              <FormGroup inline label="start time">
                <InputGroup
                  defaultValue={dateToStr(startTime)}
                  onBlur={(e) => {
                    setActiveTaskList({ viewStart: e.target.value });
                  }}
                />
              </FormGroup>
            </div>
            <div>
              <FormGroup inline label="end time">
                <InputGroup
                  defaultValue={dateToStr(endTime)}
                  onBlur={(e) => {
                    setActiveTaskList({ viewEnd: e.target.value });
                  }}
                />
              </FormGroup>
            </div>
          </Card>
        }
      >
        <Button icon="cog" rightIcon="chevron-down" />
      </Popover2>

      <TaskColorContext.Provider value={{ ...colorContext, onChange }}>
        <TimeBlockDay
          start={dateToStr(startTime)}
          end={dateToStr(endTime)}
          majorUnit={1}
          defaultEntries={activeTaskList.timeBlockEntries}
          onEntryChange={handleNewTaskList}
        />
      </TaskColorContext.Provider>
    </>
  );
}

export async function getServerSideProps(context): Promise<{
  props: Partial<TimeBlockViewProps>;
}> {
  const id = context.params.id;

  let activeTaskList = await findOneTaskList(id);

  return {
    props: {
      activeTaskList,
    },
  };
}

// function that modifies an array of time blocks to occur end to end without overlap
function getTImeBlocksWithoutOverlap(
  timeBlocks: TimeBlockEntry[],
  forcedStart?: number
) {
  const newTimeBlocks = [...timeBlocks];

  const goodBlocks = newTimeBlocks
    .filter((c) => c.start !== undefined)
    .filter((c) => !c.isFrozen)
    .sort((a, b) => a.start - b.start);

  const frozenBlocks = newTimeBlocks.filter(
    (c) => c.isFrozen && c.start !== undefined
  );

  goodBlocks.forEach((block, idx) => {
    if (idx === 0) {
      if (forcedStart !== undefined) {
        block.start = forcedStart;
      }
      return;
    }
    let prevBlock = goodBlocks[idx - 1];

    const possibleStart = prevBlock.start + prevBlock.duration * 1000;
    const possibleEnd = possibleStart + block.duration * 1000;

    // check if start or end time is in a frozen block
    const frozenConflicts = frozenBlocks.filter((c) => {
      const isBefore = possibleEnd <= c.start;
      const isAfter = possibleStart >= c.start + c.duration * 1000;

      return !(isBefore || isAfter);
    });

    if (frozenConflicts.length > 0) {
      prevBlock = frozenConflicts[0];
    }

    const actualStart = prevBlock.start + prevBlock.duration * 1000;

    block.start = actualStart;
  });

  return newTimeBlocks;
}
