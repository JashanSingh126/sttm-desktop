import React from 'react';

const DOT = {
  idle: '#888',
  connecting: '#f39c12',
  detecting: '#5b73ff',
  listening: '#27ae60',
  error: '#c0392b',
  stopped: '#888',
};
const STATUS_LABEL = {
  idle: 'Ready',
  connecting: 'Starting…',
  detecting: 'Detecting…',
  listening: 'Listening',
  error: 'Problem',
  stopped: 'Stopped',
};

// Hook-free presentation: keep controller hooks, timing, and React tree identity unchanged.
export default function renderVoiceFollowView({
  widgetPos,
  pos,
  active,
  status,
  detail,
  start,
  stop,
  autopilot,
  startAutopilot,
  autoDetect,
  startDetect,
  currentView,
  nextView,
  isMiscSlide,
  rankedView,
  cands,
  audioView,
  panelVisible,
  panelRef,
  startDrag,
  setCollapsed,
  onScreenClose,
  MODES,
  setMode,
  mode,
  setAutoDetect,
  dlProgress,
  SWITCH_CONFIRM,
  detecting,
  present,
  collapsed,
  movedRef,
  isOpen,
  setOverlayScreen,
}) {
  // Once dragged, both widgets use the free position (and the caret that points
  // back at the mic no longer makes sense, so it's hidden).
  const posOverride = widgetPos
    ? { top: widgetPos.top, left: widgetPos.left, right: 'auto', bottom: 'auto' }
    : null;

  const posLine = pos && typeof pos.lineIndex === 'number' ? pos.lineIndex + 1 : null;
  const dot = (
    <span
      className={`vf-dot${active ? ' is-live' : ''}`}
      style={{ background: DOT[status] || '#888' }}
    />
  );

  // Human-readable status line (avoids surfacing internal states like "idle").
  const statusText =
    status === 'idle'
      ? 'Ready — pick a mode and press Start'
      : `${STATUS_LABEL[status] || status}${detail ? ` — ${detail}` : ''}`;
  // Short label for the collapsed pill.
  let pillText = STATUS_LABEL[status] || 'Voice-Follow';
  if (status === 'listening') pillText = `Line ${posLine == null ? '—' : posLine}`;

  // Live stats (shown while listening). Word is 1-based like the line; confidence
  // reads as a friendly percentage.

  // Main button: Stop while a session runs, else Start. Autopilot is the default
  // hands-free experience; manual follow / one-shot detect are the fallbacks.
  let onMainClick = start;
  if (active) onMainClick = stop;
  else if (autopilot) onMainClick = startAutopilot;
  else if (autoDetect) onMainClick = startDetect;
  let mainLabel = '●  Start listening';
  if (active) mainLabel = '■  Stop';
  else if (autopilot) mainLabel = '●  Start listening';
  else if (autoDetect) mainLabel = '●  Start auto-detect';

  let projectionStatus = currentView ? 'Following' : 'Listening…';
  if (nextView?.wins >= 2) projectionStatus = 'Checking a change';
  if (isMiscSlide) projectionStatus = 'Holding a separate slide';
  const checkingNext = nextView?.cand && nextView.wins >= 1;
  const matchPool = (rankedView.length ? rankedView : cands).filter(
    (candidate) => candidate.display && candidate.shabadId !== currentView?.id,
  );
  const visibleMatches = (
    checkingNext
      ? [
          { shabadId: nextView.shabadId, display: nextView.cand, checking: true },
          ...matchPool.filter((candidate) => candidate.shabadId !== nextView.shabadId),
        ]
      : matchPool
  ).slice(0, 2);

  let microphoneLabel = 'Ready';
  if (active) microphoneLabel = audioView.device ? 'Listening' : 'Preparing…';
  const currentLabel = isMiscSlide ? 'Current Shabad · slide held' : 'Following this Shabad';

  return (
    <>
      {/* Non-modal, draggable floating panel. No backdrop, so the Gurbani stays
          fully visible while you set up and sing. Drag it by the header. */}
      {panelVisible && (
        <div ref={panelRef} data-vf-widget className="vf-panel" style={posOverride || undefined}>
          {!widgetPos && <span className="vf-caret" />}
          <div className="vf-header" onMouseDown={startDrag} title="Drag to move">
            <span className="vf-title">
              <span className="vf-grip">⠿</span>
              <span className="vf-heading-copy">
                <span>Voice Follow</span>
                <span className="vf-listening-label">{microphoneLabel}</span>
              </span>
              {active && (
                <span
                  className="vf-mic-bars"
                  role="meter"
                  aria-label="Microphone sound level"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(audioView.level * 100)}
                  title={audioView.device || 'Microphone'}
                >
                  {[0.4, 0.7, 1, 0.8, 0.5].map((scale, index) => (
                    <span key={index} style={{ height: `${3 + 17 * scale * audioView.level}px` }} />
                  ))}
                </span>
              )}
            </span>
            <span className="vf-hdr-btns">
              <button
                type="button"
                className="vf-hdr-btn"
                title="Collapse to pill"
                aria-label="Collapse"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => setCollapsed(true)}
              >
                –
              </button>
              <button
                type="button"
                className="vf-hdr-btn"
                title="Close (Esc)"
                aria-label="Close"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => (active ? setCollapsed(true) : onScreenClose())}
              >
                ×
              </button>
            </span>
          </div>

          {!autopilot && (
            <>
              <div className="vf-modes">
                {Object.keys(MODES).map((k) => (
                  <button
                    key={k}
                    type="button"
                    disabled={active}
                    onClick={() => setMode(k)}
                    className={`vf-mode${mode === k ? ' is-active' : ''}`}
                  >
                    {MODES[k].label}
                  </button>
                ))}
              </div>

              <label
                className="vf-toggle"
                title="Identify the shabad from your voice, then follow it"
              >
                <input
                  type="checkbox"
                  checked={autoDetect}
                  disabled={active}
                  onChange={(e) => setAutoDetect(e.target.checked)}
                />
                <span>Auto&#8288;-detect the shabad from my voice</span>
              </label>
            </>
          )}

          {dlProgress != null && (
            <div className="vf-dl" title="Downloading the recognition model (one time)">
              <span className="vf-dl-bar" style={{ width: `${Math.round(dlProgress * 100)}%` }} />
            </div>
          )}

          {active && (
            <div className="vf-compact-content">
              <div className={`vf-current-shabad${currentView ? ' is-following' : ''}`}>
                <div className="vf-section-label" aria-live="polite">
                  {currentView ? currentLabel : projectionStatus}
                </div>
                <div className="vf-canonical-line" lang={currentView ? 'pa' : undefined}>
                  {currentView?.line ||
                    (status === 'listening'
                      ? 'Following your selected Shabad'
                      : 'Finding the Shabad…')}
                </div>
              </div>
              {checkingNext && (
                <div className="vf-change-preview">
                  <div className="vf-section-label">
                    {nextView.wins >= 2 ? 'Confirming a change' : 'Checking a new Shabad'}
                  </div>
                  <div className="vf-canonical-line" lang="pa">
                    {nextView.cand}
                  </div>
                  <div
                    className="vf-change-track"
                    role="meter"
                    aria-label="Switch confirmation progress"
                    aria-valuemin={0}
                    aria-valuemax={SWITCH_CONFIRM}
                    aria-valuenow={nextView.wins}
                  >
                    <span style={{ width: `${(nextView.wins / SWITCH_CONFIRM) * 100}%` }} />
                  </div>
                </div>
              )}
              <details className="vf-other-matches">
                <summary>Matches</summary>
                {visibleMatches.length ? (
                  visibleMatches.map((candidate) => (
                    <div className="vf-match-card" key={candidate.shabadId}>
                      <div className="vf-match-meta">
                        {candidate.checking ? 'Checking' : 'Possible match'}
                      </div>
                      <div className="vf-canonical-line" lang="pa">
                        {candidate.display}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="vf-explanation">Listening for more matches…</div>
                )}
              </details>
            </div>
          )}
          <div className={`vf-compact-footer${active ? '' : ' is-idle'}`}>
            <button
              type="button"
              onClick={onMainClick}
              className={`vf-main ${active ? 'is-stop' : 'is-start'}`}
            >
              {mainLabel}
            </button>
          </div>
          {status !== 'listening' && !detecting && <div className="vf-status">{statusText}</div>}
        </div>
      )}

      {/* Collapsed state: a compact, draggable status pill. Click expands back
          to the panel; drag to reposition (a drag doesn't trigger the expand). */}
      {present && collapsed && (
        <button
          id="vf-pill"
          data-vf-widget
          type="button"
          className="vf-pill"
          style={posOverride || undefined}
          title="Voice-Follow — click to expand, drag to move"
          onMouseDown={startDrag}
          onClick={() => {
            if (movedRef.current) {
              // This shared React ref intentionally preserves the original drag/click behavior.
              // eslint-disable-next-line no-param-reassign
              movedRef.current = false;
              return;
            }
            setCollapsed(false);
            if (!isOpen) setOverlayScreen('voice-follow');
          }}
        >
          {dot}
          {pillText}
        </button>
      )}
    </>
  );
}
