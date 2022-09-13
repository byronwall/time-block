import { Button } from "@blueprintjs/core";
import { Popover2 } from "@blueprintjs/popover2";
import { TimeBlockEntry } from "../model/model";
import { TimeBlockDetails } from "./TimeBlockDetails";

interface TaskUnitDetailsPopoverProps {
  isDetailsOpen: boolean;
  setIsDetailsOpen: (arg0: boolean) => void;
  block: TimeBlockEntry;
}

export function TaskUnitDetailsPopover(props: TaskUnitDetailsPopoverProps) {
  const { isDetailsOpen, setIsDetailsOpen, block } = props;

  return (
    <div>
      <Popover2
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        content={<TimeBlockDetails block={block} />}
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
