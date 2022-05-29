import { Button, MenuItem } from "@blueprintjs/core";
import { ItemPredicate, ItemRenderer, Select2 } from "@blueprintjs/select";
import * as React from "react";

import { TimeBlockEntry } from "./TimeBlockDay";

interface TaskListSelectorProps {
  items: TaskList[];

  activeItem?: TaskList;
  onItemSelect: (item: TaskList) => void;
}

export interface TaskList {
  id: string;
  name: string;
  timeBlockEntries: TimeBlockEntry[];
}

export function TaskListSelector(props: TaskListSelectorProps) {
  return (
    <div>
      <Select2 {...filmSelectProps} {...props}>
        <Button
          text={props.activeItem.name}
          rightIcon="double-caret-vertical"
        />
      </Select2>
    </div>
  );
}

export const renderFilm: ItemRenderer<TaskList> = (
  film,
  { handleClick, handleFocus, modifiers, query }
) => {
  if (!modifiers.matchesPredicate) {
    return null;
  }
  const text = `${film.name}`;
  return (
    <MenuItem
      active={modifiers.active}
      disabled={modifiers.disabled}
      key={film.name}
      onClick={handleClick}
      onFocus={handleFocus}
      text={highlightText(text, query)}
    />
  );
};

export const filterFilm: ItemPredicate<TaskList> = (
  query,
  film,
  _index,
  exactMatch
) => {
  const normalizedTitle = film.name.toLowerCase();
  const normalizedQuery = query.toLowerCase();

  if (exactMatch) {
    return normalizedTitle === normalizedQuery;
  } else {
    return `${film.name}`.indexOf(normalizedQuery) >= 0;
  }
};

function highlightText(text: string, query: string) {
  let lastIndex = 0;
  const words = query
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .map(escapeRegExpChars);
  if (words.length === 0) {
    return [text];
  }
  const regexp = new RegExp(words.join("|"), "gi");
  const tokens: React.ReactNode[] = [];
  while (true) {
    const match = regexp.exec(text);
    if (!match) {
      break;
    }
    const length = match[0].length;
    const before = text.slice(lastIndex, regexp.lastIndex - length);
    if (before.length > 0) {
      tokens.push(before);
    }
    lastIndex = regexp.lastIndex;
    tokens.push(<strong key={lastIndex}>{match[0]}</strong>);
  }
  const rest = text.slice(lastIndex);
  if (rest.length > 0) {
    tokens.push(rest);
  }
  return tokens;
}

function escapeRegExpChars(text: string) {
  return text.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

const filmSelectProps = {
  itemPredicate: filterFilm,
  itemRenderer: renderFilm,
};
