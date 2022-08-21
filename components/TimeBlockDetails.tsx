import { Button, EditableText } from "@blueprintjs/core";
import { useContext, useState } from "react";
import { useSetState } from "react-use";
import { TaskColorContext } from "./ColorSansHandler";
import { TimeBlockEntry } from "./TimeBlockDay";

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
  const { description, duration, id, priority, start } = block;

  // use the color context
  const { getColorFromPriority } = useContext(TaskColorContext);

  const durationsCommon = [15, 30, 45, 60, 90, 120, 180, 240];
  return (
    <div
      style={{
        height: 200,
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
      </div>
    </div>
  );
}
