"use client";

import { useState } from "react";
import { OptionFormData, emptyOptionForm, Candidate } from "./types";

export function useOptionForm() {
  const [options, setOptions] = useState<OptionFormData[]>([]);
  const [currentOption, setCurrentOption] = useState<OptionFormData>(emptyOptionForm());
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showVice1, setShowVice1] = useState(false);
  const [showVice2, setShowVice2] = useState(false);

  const updateCandidate = (
    type: "candidate" | "vice1" | "vice2",
    field: keyof Candidate,
    value: string
  ) => {
    setCurrentOption((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));
  };

  const addOrUpdateOption = () => {
    if (editingIndex !== null) {
      const newOptions = [...options];
      newOptions[editingIndex] = currentOption;
      setOptions(newOptions);
      setEditingIndex(null);
    } else {
      setOptions([...options, currentOption]);
    }
    resetForm();
  };

  const editOption = (index: number) => {
    setCurrentOption(options[index]);
    setEditingIndex(index);
    setShowVice1(!!options[index].vice1.name);
    setShowVice2(!!options[index].vice2.name);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setCurrentOption(emptyOptionForm());
    setShowVice1(false);
    setShowVice2(false);
    setEditingIndex(null);
  };

  return {
    options,
    currentOption,
    setCurrentOption,
    editingIndex,
    showVice1,
    setShowVice1,
    showVice2,
    setShowVice2,
    updateCandidate,
    addOrUpdateOption,
    editOption,
    removeOption,
    resetForm,
  };
}
