import {
  Button,
  ButtonGroup,
  Card,
  EditableText,
  Switch,
} from "@blueprintjs/core";

import { TimeBlockEntry } from "../model/model";
import { useTaskStore } from "../model/TaskStore";
import { handleBooleanChange } from "./helpers";

interface TimeBlockDetailsProps {
  block: TimeBlockEntry;
}

const durationsCommon = [15, 30, 45, 60, 90, 120, 180];

export function TimeBlockDetails(props: TimeBlockDetailsProps) {
  const { block } = props;

  const onChangePartial = useTaskStore(
    (store) => store.updateTimeBlockEntryPartial
  );

  const handleChange = (data: Partial<TimeBlockEntry>) => {
    onChangePartial(block.id, data);
  };

  const { description, start } = block;

  const getColorFromPriority = useTaskStore(
    (store) => store.getColorFromPriority
  );

  const onIncrementDay = () => {
    handleChange({ day: block.day + 1 });
  };

  const onDecrementDay = () => {
    handleChange({ day: block.day - 1 });
  };

  return (
    <Card
      style={{
        width: 200,
      }}
    >
      <div>
        <div>
          <EditableText
            value={description}
            onChange={(description) => handleChange({ description })}
            onConfirm={(description) => handleChange({ description })}
            confirmOnEnterKey={true}
            multiline
          />
        </div>

        <div>
          {durationsCommon.map((duration) => (
            <Button
              key={duration}
              text={duration}
              style={{
                border:
                  duration * 60 === block.duration
                    ? "2px solid black"
                    : undefined,
              }}
              onClick={() => handleChange({ duration: duration * 60 })}
            />
          ))}
        </div>
        <div>
          {[1, 2, 3, 4, 5].map((priority) => (
            <Button
              key={priority}
              text={priority.toString()}
              onClick={() => handleChange({ priority })}
              style={{
                backgroundColor: getColorFromPriority(priority ?? 5),
                border:
                  priority === block.priority ? "2px solid black" : undefined,
              }}
            />
          ))}
        </div>

        <div>
          <Switch
            label="Complete"
            checked={block.isComplete}
            onChange={handleBooleanChange((isComplete) =>
              handleChange({ isComplete })
            )}
          />
        </div>

        <div>
          <Switch
            label="Frozen"
            checked={block.isFrozen}
            onChange={handleBooleanChange((isFrozen) =>
              handleChange({ isFrozen })
            )}
          />
        </div>
        <div>
          <ButtonGroup>
            <Button
              icon="arrow-left"
              onClick={onDecrementDay}
              disabled={block.day === 0}
            />
            <Button icon="arrow-right" onClick={onIncrementDay} />
          </ButtonGroup>
        </div>
      </div>
    </Card>
  );
}
