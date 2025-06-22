import supabase from "./supabase";

export const createInterview = async (user_id: string) => {
    const { data, error } = await supabase.from("interviews").insert({ user_id }).select().single();

    if (error) {
        console.error("Error creating interview:", error);
        return null;
    }
    return data;
};
