import { Input } from "../ui";

interface RoomCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

function RoomCodeInput({
  value,
  onChange,
  error,
}: RoomCodeInputProps) {
  return (
    <Input
      id="room-code"
      label="Room Code"
      placeholder="Enter room code"
      value={value}
      onChange={(event) =>
        onChange(event.target.value.toUpperCase())
      }
      maxLength={6}
      autoCapitalize="characters"
      error={error}
    />
  );
}

export default RoomCodeInput;