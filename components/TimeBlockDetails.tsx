import { Button, Card, EditableText, Switch } from "@blueprintjs/core";
import { useContext, useState } from "react";
import { TimeBlockEntry } from "../model/model";
import { handleBooleanChange } from "./helpers";

import { TaskColorContext } from "./TaskColorContext";

interface TimeBlockDetailsProps {
  block: TimeBlockEntry;

  onChange(id: string, newEntry: TimeBlockEntry): void;
}

export function TimeBlockDetails(props: TimeBlockDetailsProps) {
  // des props
  const { block, onChange } = props;

  // des block

  const handleChange = (data: Partial<TimeBlockEntry>) => {
    onChange(block.id, {
      ...block,
      ...data,
    });
  };

  // des block copy
  const { description, start } = block;

  // use the color context
  const { getColorFromPriority } = useContext(TaskColorContext);

  const durationsCommon = [15, 30, 45, 60, 90, 120, 180];
  return (
    <Card
      style={{
        height: 250,
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
        <div>{start}</div>

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

        {/* add a switch to track complete */}
        <div>
          <Switch
            label="Complete"
            checked={block.isComplete}
            onChange={handleBooleanChange((isComplete) =>
              handleChange({ isComplete })
            )}
          />
        </div>

        {/* add a switch to track isFrozen */}
        <div>
          <Switch
            label="Frozen"
            checked={block.isFrozen}
            onChange={handleBooleanChange((isFrozen) =>
              handleChange({ isFrozen })
            )}
          />
        </div>
      </div>
    </Card>
  );
}
