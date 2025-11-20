"use client";

import { useState } from "react";
import { OptionFormData, CandidateForm } from "./types";
import { createEmptyOption, createEmptyCandidate } from "./formHelpers";

export function useOptionForm() {
  const [options, setOptions] = useState<OptionFormData[]>([]);
  const [currentOption, setCurrentOption] = useState<OptionFormData>(createEmptyOption());
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const updateCandidate = (
    field: keyof CandidateForm,
    value: string
  ) => {
    setCurrentOption((prev) => ({
      ...prev,
      candidate: {
        ...prev.candidate,
        [field]: value,
      },
    }));
  };

  const addVice = () => {
    setCurrentOption((prev) => ({
      ...prev,
      vice: [...prev.vice, createEmptyCandidate()],
    }));
  };

  const removeVice = (index: number) => {
    setCurrentOption((prev) => ({
      ...prev,
      vice: prev.vice.filter((_, i) => i !== index),
    }));
  };

  const updateVice = (
    index: number,
    field: keyof CandidateForm,
    value: string
  ) => {
    setCurrentOption((prev) => ({
      ...prev,
      vice: prev.vice.map((v, i) =>
        i === index ? { ...v, [field]: value } : v
      ),
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
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setCurrentOption(createEmptyOption());
    setEditingIndex(null);
  };

  return {
    options,
    currentOption,
    setCurrentOption,
    editingIndex,
    updateCandidate,
    addVice,
    removeVice,
    updateVice,
    addOrUpdateOption,
    editOption,
    removeOption,
    resetForm,
  };
}
