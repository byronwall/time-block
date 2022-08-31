import { Card, InputGroup, Overlay } from "@blueprintjs/core";
import { useContext, useEffect, useRef, useState } from "react";
import { usePrevious } from "react-use";
import { handleStringChange } from "./helpers";
import { SearchContext } from "./SearchContext";

export function SearchOverlay() {
  const searchContext = useContext(SearchContext);

  const { searchText, isSearchOpen, onChange } = searchContext;

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
      onClose={() => onChange({ isSearchOpen: false })}
      hasBackdrop={false}
      transitionDuration={0}
    >
      <Card elevation={4}>
        <InputGroup
          inputRef={inputRef}
          value={searchText}
          onChange={handleStringChange((searchText) =>
            onChange({ searchText })
          )}
        />
      </Card>
    </Overlay>
  );
}
