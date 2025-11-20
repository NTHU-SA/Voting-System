"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ActivityFormFieldsProps {
  formData: {
    name: string;
    type: string;
    description: string;
    rule: "choose_one" | "choose_all";
    open_from: string;
    open_to: string;
  };
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void;
  disabled?: boolean;
}

export function ActivityFormFields({
  formData,
  onChange,
  disabled = false,
}: ActivityFormFieldsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">活動名稱 *</Label>
          <Input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={onChange}
            placeholder="例：2025 學生會會長選舉"
            disabled={disabled}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">活動類型 *</Label>
          <Input
            id="type"
            name="type"
            type="text"
            value={formData.type}
            onChange={onChange}
            placeholder="例：學生會選舉"
            disabled={disabled}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">活動說明</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={onChange}
          placeholder="例：本次選舉將選出新任學生會會長及兩位副會長，任期為一年。請仔細閱讀各候選人政見後投票。"
          disabled={disabled}
          rows={4}
        />
        <p className="text-xs text-muted-foreground">
          選填，將顯示在投票頁面作為活動說明
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rule">投票方式 *</Label>
        <select
          id="rule"
          name="rule"
          value={formData.rule}
          onChange={onChange}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          disabled={disabled}
          required
        >
          <option value="choose_one">單選（選擇一個候選人）</option>
          <option value="choose_all">
            多選評分（對所有候選人表態）
          </option>
        </select>
        <p className="text-xs text-muted-foreground">
          單選：投票者只能選擇一個選項 |
          多選評分：投票者需對每個選項表態（支持/反對/無意見）
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="open_from">開始時間 *</Label>
          <Input
            id="open_from"
            name="open_from"
            type="datetime-local"
            value={formData.open_from}
            onChange={onChange}
            disabled={disabled}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="open_to">結束時間 *</Label>
          <Input
            id="open_to"
            name="open_to"
            type="datetime-local"
            value={formData.open_to}
            onChange={onChange}
            disabled={disabled}
            required
          />
        </div>
      </div>
    </div>
  );
}
