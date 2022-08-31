import { Button } from "@blueprintjs/core";
import { Popover2 } from "@blueprintjs/popover2";
import { TimeBlockEntry } from "../model/model";
import { TimeBlockDetails } from "./TimeBlockDetails";

interface TaskUnitDetailsPopoverProps {
  isDetailsOpen: boolean;
  setIsDetailsOpen: (arg0: boolean) => void;
  block: TimeBlockEntry;
  onChange: (id: string, newEntry: TimeBlockEntry) => void;
}

export function TaskUnitDetailsPopover(props: TaskUnitDetailsPopoverProps) {
  const { isDetailsOpen, setIsDetailsOpen, block, onChange } = props;

  return (
    <div>
      <Popover2
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        content={<TimeBlockDetails block={block} onChange={onChange} />}
        position="right"
      >
        <Button
          icon="chevron-down"
          minimal
          onClick={() => setIsDetailsOpen(true)}
        />
      </Popover2>
    </div>
  );
}
