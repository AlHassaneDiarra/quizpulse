const rooms = new Map();

function createRoom(roomCode, hostPlayer) {
  const room = {
    code: roomCode,
    players: [hostPlayer],
    status: "waiting",
  };

  rooms.set(roomCode, room);

  return room;
}

function getRoom(roomCode) {
  return rooms.get(roomCode);
}

function roomExists(roomCode) {
  return rooms.has(roomCode);
}

module.exports = {
  rooms,
  createRoom,
  getRoom,
  roomExists,
};