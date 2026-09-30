import { Input } from "../ui";

interface UsernameInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

function UsernameInput({
  value,
  onChange,
  error,
}: UsernameInputProps) {
  return (
    <Input
      id="username"
      label="Username"
      placeholder="Enter your username"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      maxLength={20}
      error={error}
    />
  );
}

export default UsernameInput;