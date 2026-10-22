import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Room } from '../../domain/models';
import { useStudyProfile } from '../profile/StudyProfileContext';
import { SetupSheet } from '../profile/SetupSheet';
import { useTables } from './TablesContext';
import { TableSheet } from './TableSheet';

/**
 * "Set a table" from a room (T1): signs in first when needed (the quick
 * path: email, code, first name), then opens the sheet and goes to the new
 * table's page. `available` is false without the focus service.
 */
export function useTableFlow(room: Room | null | undefined) {
  const navigate = useNavigate();
  const { api } = useTables();
  const profile = useStudyProfile();
  const [signIn, setSignIn] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [open, setOpen] = useState(false);
  // SetupSheet calls onClose and then onDone in the same tick when it saves.
  const finished = useRef(false);

  useEffect(() => {
    if (waiting && profile.identity && !signIn) {
      setWaiting(false);
      setOpen(true);
    }
  }, [waiting, profile.identity, signIn]);

  const start = () => {
    if (profile.identity) setOpen(true);
    else {
      setWaiting(true);
      setSignIn(true);
    }
  };

  const element = room ? (
    <>
      <SetupSheet quick open={signIn}
        onDone={() => { finished.current = true; }}
        onClose={() => {
          setSignIn(false);
          queueMicrotask(() => {
            if (!finished.current) setWaiting(false);
            finished.current = false;
          });
        }} />
      <TableSheet open={open} room={room} onClose={() => setOpen(false)}
        onSaved={(table) => { setOpen(false); navigate(`/t/${table.link}`, { state: { justSet: true } }); }} />
    </>
  ) : null;
  return { available: Boolean(api && profile.available), start, element };
}
