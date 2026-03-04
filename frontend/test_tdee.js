const u = { "id": "default-user-id", "nickname": "减肥大王", "avatar_id": "🍄", "gender": "女", "age": 25, "height": 169, "weight": 54, "target_calories": null, "bmi": 18.9, "activity_level": 1.2, "level": null, "level_title": null, "measurements": {}, "created_at": "2026-03-02 08:09:29", "body_fat": null, "bmr": null, "avatarId": "🍄", "targetCalories": null, "levelTitle": null, "bodyFat": null };

const weight = u.weight || 70;
const height = u.height || 175;
const age = u.age || 25;
const gender = u.gender || '女';
const bodyFat = u.bodyFat || 0;

let bmr = 0;
if (bodyFat && bodyFat > 0) {
    const leanBodyMass = weight * (1 - bodyFat / 100);
    bmr = Math.round(370 + (21.6 * leanBodyMass));
} else {
    if (gender === '男') {
        bmr = Math.round(10 * weight + 6.25 * height - 5 * age + 5);
    } else {
        bmr = Math.round(10 * weight + 6.25 * height - 5 * age - 161);
    }
}

let tdee = 0;
if (bmr > 0) {
    tdee = Math.round(bmr * (u.activityLevel || 1.2));
} else {
    tdee = u.targetCalories || 0;
}

console.log("BMR:", bmr);
console.log("TDEE:", tdee);
