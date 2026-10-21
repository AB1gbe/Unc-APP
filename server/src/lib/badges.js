// Earned badges (session 20). Worked out from what members actually did,
// never bought or granted by hand. Rules (also in docs/Features):
//   fast         ⚡ Fast responder  usually replies within an hour
//   top-finder   🏆 Top finder      5+ deals as the seller, rated 4.5★+ (3+ ratings)
//   trusted      🤝 Trusted buyer   3+ deals as the buyer, rated 4.5★+ (2+ ratings)
//   new          🌱 New member      joined in the last 30 days
export function badgeQueries(db, ratings, activity) {
  const user = db.prepare(`SELECT created_at >= datetime('now', '-30 days') AS is_new FROM users WHERE id = ?`);
  const asSeller = db.prepare('SELECT COUNT(*) AS n FROM deals WHERE vendor_id = ?');
  const asBuyer = db.prepare('SELECT COUNT(*) AS n FROM deals WHERE buyer_id = ?');

  return function badgesFor(userId, replyTime = activity.replyTime(userId)) {
    const badges = [];
    const rating = ratings.summaryFor(userId);
    if (replyTime === 'hour') badges.push('fast');
    if (asSeller.get(userId).n >= 5 && rating.count >= 3 && rating.average >= 4.5) badges.push('top-finder');
    if (asBuyer.get(userId).n >= 3 && rating.count >= 2 && rating.average >= 4.5) badges.push('trusted');
    if (user.get(userId)?.is_new) badges.push('new');
    return badges;
  };
}
