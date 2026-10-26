/* ═══════════════════════════════════════════════════════════════
   leaderboard.js — واجهة الترتيب (تستخدم المنافسين الحقيقيين)
   ═══════════════════════════════════════════════════════════════ */
'use strict';

window.LeaderboardUI = {
  render: function() {
    // نستخدم قائمة المنافسين الجديدة إذا متوفرة
    var all = (typeof getRivalLeaderboard === 'function')
      ? getRivalLeaderboard()
      : [{ name: 'أنت', coins: STATE.totalEarned || 0, avatar: '🏴‍☠️', isMe: true }];

    return all.map(function(p, i) {
      var r = i + 1;
      var medal = r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : '#' + r;
      var style = p.isMe ? 'border-color:var(--gold-1);box-shadow:0 0 20px rgba(245,196,94,.4)' : '';
      var avatar = p.avatar || '🏴‍☠️';
      return '<div class="list-item" style="' + style + '">' +
        '<div class="emoji" style="font-size:20px;width:36px;text-align:center">' + medal + '</div>' +
        '<div class="emoji" style="font-size:28px;width:36px;text-align:center">' + avatar + '</div>' +
        '<div class="list-item-info">' +
          '<div class="list-item-name">' + p.name + (p.isMe ? ' (أنت)' : '') + '</div>' +
          '<div class="list-item-desc">مستوى ' + (p.level || 1) + ' · ' + p.coins.toLocaleString() + ' 💰</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }
};

console.log('[UI/Leaderboard] جاهز');
