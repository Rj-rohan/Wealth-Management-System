"use client";
import { useState, useEffect, useRef } from 'react';

export default function SearchableDropdown({
  options = [],
  value = "",
  onChange,
  placeholder = "Select option...",
  allowCreate = false,
  onCreate,
  disabled = false,
  required = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);

  // Helper to retrieve option details
  const getOptionLabel = (val) => {
    const found = options.find(opt => {
      if (typeof opt === 'object') return opt.id === val || opt.name === val;
      return opt === val;
    });
    if (found) {
      return typeof found === 'object' ? found.name : found;
    }
    return val || "";
  };

  const getOptionValue = (opt) => {
    return typeof opt === 'object' ? opt.id : opt;
  };

  // Sync search input with value when changed externally
  useEffect(() => {
    setSearch(getOptionLabel(value));
  }, [value, options]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        // Reset search to active value label
        setSearch(getOptionLabel(value));
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, options]);

  const filteredOptions = options.filter(opt => {
    const label = typeof opt === 'object' ? opt.name : opt;
    return label.toLowerCase().includes(search.toLowerCase());
  });

  const showCreateOption = allowCreate && search.trim() !== "" && !options.some(opt => {
    const label = typeof opt === 'object' ? opt.name : opt;
    return label.toLowerCase() === search.trim().toLowerCase();
  });

  const handleSelect = (opt) => {
    const val = getOptionValue(opt);
    onChange(val);
    setSearch(getOptionLabel(val));
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleCreate = async () => {
    if (!onCreate) return;
    try {
      const createdItem = await onCreate(search.trim());
      if (createdItem) {
        handleSelect(createdItem);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (disabled) return;
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    const itemsCount = filteredOptions.length + (showCreateOption ? 1 : 0);

    if (e.key === "ArrowDown") {
      setHighlightedIndex(prev => (prev + 1) % itemsCount);
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setHighlightedIndex(prev => (prev - 1 + itemsCount) % itemsCount);
      e.preventDefault();
    } else if (e.key === "Enter") {
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        handleSelect(filteredOptions[highlightedIndex]);
      } else if (showCreateOption && highlightedIndex === filteredOptions.length) {
        handleCreate();
      }
      e.preventDefault();
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setSearch(getOptionLabel(value));
      setHighlightedIndex(-1);
      e.preventDefault();
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef} onKeyDown={handleKeyDown}>
      <div className="relative flex items-center">
        <input
          type="text"
          disabled={disabled}
          required={required && !value}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-[#1C2128]/70 border border-white/10 rounded-lg p-2.5 pr-8 text-sm text-white focus:outline-none focus:border-green-500 transition-colors"
          style={{ backdropFilter: "blur(4px)" }}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className="absolute right-2.5 text-gray-500 hover:text-white transition-colors"
        >
          {isOpen ? "▲" : "▼"}
        </button>
      </div>

      {isOpen && (
        <ul className="absolute z-50 w-full mt-1.5 max-h-60 overflow-y-auto bg-[#161B22]/95 border border-white/10 rounded-lg shadow-xl backdrop-blur-md">
          {filteredOptions.length === 0 && !showCreateOption && (
            <li className="p-2.5 text-xs text-gray-500 text-center">No options found</li>
          )}
          {filteredOptions.map((opt, index) => {
            const isSelected = getOptionValue(opt) === value;
            const isHighlighted = index === highlightedIndex;
            const label = typeof opt === 'object' ? opt.name : opt;

            return (
              <li
                key={getOptionValue(opt)}
                onClick={() => handleSelect(opt)}
                className={`p-2.5 text-xs font-medium cursor-pointer transition-colors ${
                  isSelected ? "bg-green-500/20 text-green-400" : ""
                } ${isHighlighted ? "bg-white/5 text-white" : "text-gray-300"}`}
              >
                {label}
              </li>
            );
          })}
          {showCreateOption && (
            <li
              onClick={handleCreate}
              className={`p-2.5 text-xs font-bold text-green-400 cursor-pointer border-t border-white/5 hover:bg-green-500/10 ${
                highlightedIndex === filteredOptions.length ? "bg-white/5" : ""
              }`}
            >
              ＋ Create &ldquo;{search.trim()}&rdquo;
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
