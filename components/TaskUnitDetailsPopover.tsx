import { Button } from "@blueprintjs/core";
import { Popover2 } from "@blueprintjs/popover2";
import { TimeBlockEntry } from "../model/model";
import { useTaskStore } from "../model/TaskStore";
import { TimeBlockDetails } from "./TimeBlockDetails";

interface TaskUnitDetailsPopoverProps {
  isDetailsOpen: boolean;
  block: TimeBlockEntry;
}

export function TaskUnitDetailsPopover(props: TaskUnitDetailsPopoverProps) {
  const { isDetailsOpen, block } = props;

  const onCloseDetails = useTaskStore((state) => state.onCloseDetails);
  const onOpenDetails = useTaskStore((state) => state.toggleDetailShortcut);

  return (
    <div>
      <Popover2
        isOpen={isDetailsOpen}
        onClose={onCloseDetails}
        content={<TimeBlockDetails block={block} />}
        position="right"
      >
        <Button
          icon="chevron-down"
          minimal
          onClick={() => onOpenDetails(true)}
        />
      </Popover2>
    </div>
  );
}
