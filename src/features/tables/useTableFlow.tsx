import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Room } from '../../domain/models';
import { useStudyProfile } from '../profile/StudyProfileContext';
import { SetupSheet } from '../profile/SetupSheet';
import { useTables } from './TablesContext';
import { TableSheet } from './TableSheet';
import { SessionTableSheet } from './SessionTableSheet';

/**
 * "Set a table" from a room (T1): signs in first when needed (the quick
 * path: email, code, first name), then opens the sheet and goes to the new
 * table's page. `fromSession` does the same for inviting people to the
 * running session (#153); cancelling the sign-in leaves the session as it
 * was. `available` is false without the focus service.
 */
export function useTableFlow(room: Room | null | undefined) {
  const navigate = useNavigate();
  const { api } = useTables();
  const profile = useStudyProfile();
  const [signIn, setSignIn] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [open, setOpen] = useState<'slots' | 'session' | null>(null);
  const [mode, setMode] = useState<'slots' | 'session'>('slots');
  // SetupSheet calls onClose and then onDone in the same tick when it saves.
  const finished = useRef(false);

  useEffect(() => {
    if (waiting && profile.identity && !signIn) {
      setWaiting(false);
      setOpen(mode);
    }
  }, [waiting, profile.identity, signIn, mode]);

  const begin = (next: 'slots' | 'session') => {
    setMode(next);
    if (profile.identity) setOpen(next);
    else {
      setWaiting(true);
      setSignIn(true);
    }
  };
  const done = (table: { link: string }) => {
    setOpen(null);
    navigate(`/t/${table.link}`, { state: { justSet: true } });
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
      <TableSheet open={open === 'slots'} room={room} onClose={() => setOpen(null)} onSaved={done} />
      <SessionTableSheet open={open === 'session'} room={room} onClose={() => setOpen(null)} onSaved={done} />
    </>
  ) : null;
  return {
    available: Boolean(api && profile.available),
    start: () => begin('slots'),
    fromSession: () => begin('session'),
    element,
  };
}
