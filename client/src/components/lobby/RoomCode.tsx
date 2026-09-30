interface RoomCodeProps {
  code: string;
}

function RoomCode({ code }: RoomCodeProps) {
  async function copyCode() {
    await navigator.clipboard.writeText(code);
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-5 text-center">
      <p className="text-sm text-slate-400">
        Room Code
      </p>

      <div className="mt-2 flex items-center justify-center gap-3">
        <span className="text-3xl font-bold tracking-[0.3em] text-white">
          {code}
        </span>

        <button
          type="button"
          onClick={copyCode}
          className="rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-slate-700 hover:text-white"
        >
          Copy
        </button>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Share this code with your friends
      </p>
    </div>
  );
}

export default RoomCode;