import { createContext } from "react";

export const SearchContext = createContext<SearchContext>(null);

export interface SearchContext {
  isSearchOpen: boolean;
  searchText: string;

  onChange: (newState: Partial<SearchContext>) => void;
}
