import { z } from "zod";

export const SourceUploadInputSchema = z.object({
  title: z.string().trim().min(1, "Source title is required").max(200),
  type: z.enum(["github", "notes", "chat"], {
    message: "Type must be 'github', 'notes', or 'chat'",
  }),
  rawText: z.string().trim().min(1, "Source text cannot be empty").max(1000000, "Source text exceeds 1MB limit"),
  accessLevel: z.enum(["team", "leads_only", "confidential"], {
    message: "Access level must be 'team', 'leads_only', or 'confidential'",
  }),
});

export const ReviewActionInputSchema = z.object({
  action: z.enum(["approve", "reject", "edit"], {
    message: "Action must be 'approve', 'reject', or 'edit'",
  }),
  editedText: z.string().trim().optional(),
}).refine(
  (data) => {
    if (data.action === "edit") {
      return !!data.editedText && data.editedText.length > 0;
    }
    return true;
  },
  {
    message: "editedText is required when action is 'edit'",
    path: ["editedText"],
  }
);

export const AnswerGapInputSchema = z.object({
  answer: z.string().trim().min(1, "Answer text is required").max(10000, "Answer text is too long"),
});

export const PublishHandoverInputSchema = z.object({
  targetRole: z.enum(["owner_reviewer", "incoming_lead", "contributor"]).optional(),
});

export const AcknowledgeHandoverInputSchema = z.object({
  handoverId: z.string().trim().min(1, "handoverId is required"),
  notes: z.string().trim().max(2000).optional(),
});

export const ReconstructInputSchema = z.object({
  useCache: z.boolean().optional(),
});
