import { Button, InputGroup } from "@blueprintjs/core";
import { MouseEvent, MouseEventHandler } from "react";
import Highlighter from "react-highlight-words";
import { useTaskStore } from "../model/TaskStore";

type TaskUnitEditOrDisplayProps = {
  isEdit: any;
  editText: string;
  setEditText: (arg0: string) => void;
  acceptEditText: () => void;
  setIsEdit: (arg0: boolean) => void;
  isLiveSearch: any;

  description: any;
};

export function TaskUnitEditOrDisplay(props: TaskUnitEditOrDisplayProps) {
  const {
    isEdit,
    editText,
    setEditText,
    acceptEditText,
    setIsEdit,
    isLiveSearch,

    description,
  } = props;

  const searchText = useTaskStore((state) => state.searchText);

  return (
    <div>
      {isEdit ? (
        <div>
          <InputGroup
            value={editText}
            onChange={(evt) => setEditText(evt.target.value)}
            onKeyDown={(evt) => {
              if (evt.key === "Enter") {
                acceptEditText();
              }

              if (evt.key === "Escape") {
                setIsEdit(false);
              }
            }}
            autoFocus
            rightElement={
              <Button minimal icon="tick" onClick={acceptEditText} />
            }
          />
        </div>
      ) : (
        <Highlighter
          highlightClassName="highlight"
          searchWords={isLiveSearch ? [searchText] : []}
          autoEscape={true}
          textToHighlight={description}
        />
      )}
    </div>
  );
}
