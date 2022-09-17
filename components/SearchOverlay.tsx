import { Card, InputGroup, Overlay } from "@blueprintjs/core";
import { useEffect, useRef } from "react";
import { usePrevious } from "react-use";
import { useTaskStore } from "../model/TaskStore";
import { handleStringChange } from "./helpers";

export function SearchOverlay() {
  const isSearchOpen = useTaskStore((state) => state.isSearchOpen);
  const setIsSearchOpen = useTaskStore((state) => state.setIsSearchOpen);
  const searchText = useTaskStore((state) => state.searchText);
  const setSearchText = useTaskStore((state) => state.setSearchText);

  // store ref for input group
  const inputRef = useRef<HTMLInputElement>(null);

  // store prev is open
  const prevIsOpen = usePrevious(isSearchOpen);

  // focus if open and not previously open
  useEffect(() => {
    if (isSearchOpen && !prevIsOpen) {
      inputRef.current?.focus();
    }
  });

  return (
    <Overlay
      isOpen={isSearchOpen}
      onClose={() => setIsSearchOpen(false)}
      hasBackdrop={false}
      transitionDuration={0}
    >
      <Card elevation={4}>
        <InputGroup
          inputRef={inputRef}
          value={searchText}
          onChange={handleStringChange((searchText) =>
            setSearchText(searchText)
          )}
        />
      </Card>
    </Overlay>
  );
}
