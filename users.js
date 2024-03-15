const {sortBy, indexOf} = require('lodash')

const userDB = {
  users: [],
  add(id, nickname, games, accPoints, bestScore) {
    const user = { id, nickname, games, accPoints, bestScore };
    this.users.push(user);
  },
  show() {
    console.log(this.users);
  },
  remove(id) {
    this.users = this.users.filter((user) => 
    {if (user.id === id) { return false; } return true; });
  },
  update(id, nickname, points) {
    const index = indexOf(this.users, this.users.find((user) => 
    user.id === id));
    if (index > 0) {
      this.users[index].games += 1;
      this.users[index].accPoints += points;
      if (this.users[index].bestScore < points) {
        this.users[index].bestScore = points
      }
    } else {
      this.add(id, nickname, 1, points, points);
    }
  },
  clone() {
    return Object.assign([], this.users);
  },
  departments() {
    const scores = this.users.map((user) => [user.id, user.nickname, user.bestScore]);
  },
  scores() {
    const sorted = sortBy(this.users, bestScore)
    return sorted
  },
  place(id) {
    const sorted = this.users.scores()
    const index = indexOf(sorted, this.users.find((user) => 
    user.id === id))
    return index
  }
}

module.exports = { userDB }