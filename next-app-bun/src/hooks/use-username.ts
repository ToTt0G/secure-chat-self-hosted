"use client";

import { useEffect, useState } from "react";
import { nanoid } from "nanoid";

const STORAGE_KEY = "chat_username";

const ANIMALS = [
  "shark",
  "wolf",
  "tiger",
  "eagle",
  "falcon",
  "bear",
  "lion",
  "hawk",
  "fox",
  "panther",
];

const generateUsername = () => {
  const word = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `anonymous-${word}-${nanoid(5)}`;
};

export const useUsername = () => {
  const [username, setUsername] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUsername(stored);
      return;
    }

    const generated = generateUsername();
    localStorage.setItem(STORAGE_KEY, generated);
    setUsername(generated);
  }, []);

  return { username };
};
