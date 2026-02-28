export interface IUser {
    id: string; // MVP: Hardcoded locally
    nickname: string;
    avatarId: number;
    height: number; // cm
    weight: number; // kg
    targetCalories: number; // kcal
    bmi: number;
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
}

export interface IIntakeEntry extends IJournalEntryBase {
    type: 'intake';
    weight: number;
    unit: IntakeUnit;
    mealType: string; // 早餐, 午餐 等
}

export interface IExerciseEntry extends IJournalEntryBase {
    type: 'exercise';
    amount: number;
    unit: ExerciseUnit;
    category: string; // 有氧, 无氧 等
}

export type JournalEntry = IIntakeEntry | IExerciseEntry;
