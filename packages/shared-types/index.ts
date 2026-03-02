export interface IUser {
    id: string;
    nickname: string;
    avatarId: string; // 修改为 string，因为后端下发的是 Emoji 或标识符
    height: number; // cm
    weight: number; // kg
    targetCalories: number; // kcal
    bmi: number;
    gender: '男' | '女';
    age: number;
    activityLevel: number; // 1.2, 1.375, 1.55, 1.725, 1.9
    bodyFat?: number; // %
    bmr?: number; // kcal
    level: number;
    levelTitle: string;
    measurements: {
        chest?: number;
        waist?: number;
        hip?: number;
        arm_left?: number;
        arm_right?: number;
        thigh_left?: number;
        thigh_right?: number;
        calf_left?: number;
        calf_right?: number;
    };
}

export type IntakeUnit = 'g' | '份';
export type ExerciseUnit = '分钟' | '次' | '组';

export interface IDailyRecord {
    id: string;
    userId: string;
    date: string; // YYYY-MM-DD
    totalIntake: number; // kcal
    totalBurn: number; // kcal
}

// 基础手帐类型区分
export interface IJournalEntryBase {
    id: string;
    userId: string;
    date: string; // YYYY-MM-DD
    timestamp: string; // ISO string 方便排序
    type: 'intake' | 'exercise';
    calories: number; // 绝对值
    emoji: string;
    title: string;
    mood?: string;
    meta?: any; // 用于存储特定类型的原始数据
}

export interface IIntakeEntry extends IJournalEntryBase {
    type: 'intake';
    weight?: number;
    unit?: IntakeUnit;
    mealType?: string; // 早餐, 午餐 等
}

export interface IExerciseEntry extends IJournalEntryBase {
    type: 'exercise';
    amount?: number;
    unit?: ExerciseUnit;
    category?: string; // 有氧, 无氧 等
}

export type JournalEntry = IIntakeEntry | IExerciseEntry;
