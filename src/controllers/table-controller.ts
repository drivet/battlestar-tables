import { injectable } from 'inversify';
import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Path,
  Post,
  Put,
  Query,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa';

import { InviteUpdatePayload, Table, TableCreatePayload } from '../services/table-models';
import { TableService } from './../services/table-service';

interface ValidateErrorJSON {
  message: 'Validation failed';
  details: { [name: string]: unknown };
}

@Security('ApiKeyAuth')
@Route('tables')
@Tags('Tables')
@injectable()
export class TableController extends Controller {
  constructor(private tableService: TableService) {
    super();
  }

  /**
   * Creates a game table.
   *
   * @param requestBody the JSON body in the request
   */
  @Response<ValidateErrorJSON>(422, 'Validation Failed')
  @SuccessResponse('201', 'Created')
  @Post()
  async createTable(@Body() requestBody: TableCreatePayload): Promise<Table> {
    this.setStatus(201);
    return this.tableService.createTable(requestBody);
  }

  /**
   * Fetches an existing table
   *
   * @param id the table id of the table you want to fetch
   */
  @Response(404, 'Not Found')
  @SuccessResponse('200', 'Ok')
  @Get('{id}')
  public async getTable(@Path() id: string): Promise<Table> {
    const table = await this.tableService.getTable(id);
    if (!table || !table._id) {
      throw {
        message: 'table not found',
        status: 404,
      };
    }
    return table;
  }

  /**
   * Fetches a list of tables
   * @param inviter the user who sent out the invites
   * @param invitee the user who got the invite
   */
  @SuccessResponse('200', 'Ok')
  @Get()
  public async getTables(@Query() inviter?: string, @Query() invitee?: string): Promise<Table[]> {
    return await this.tableService.getTables(inviter, invitee);
  }

  /**
   * Deletes a table.  Not an error if the table does not exist
   *
   * @param id the table id of the table you want to delete
   */
  @SuccessResponse('204', 'No content')
  @Delete('{id}')
  public async deleteTable(@Path() id: string): Promise<void> {
    await this.tableService.deleteTable(id);
  }

  /**
   * Creates an invitation
   *
   * @param requestBody the JSON body in the request
   */
  @SuccessResponse('204', 'No content')
  @Put('{id}/invitations/{invitee}')
  async createInvite(@Path() id: string, @Path() invitee: string): Promise<void> {
    return this.tableService.createInvite(id, invitee);
  }

  /**
   * Updates an invitation
   *
   * @param requestBody the JSON body in the request
   */
  @Response<ValidateErrorJSON>(422, 'Validation Failed')
  @SuccessResponse('204', 'No content')
  @Patch('{id}/invitations/{invitee}')
  async updateInvite(
    @Path() id: string,
    @Path() invitee: string,
    @Body() requestBody: InviteUpdatePayload
  ): Promise<void> {
    this.tableService.updateInvite(id, invitee, requestBody);
  }

  /**
   * Deletes an invitation
   *
   * @param id the table id of the table you want to delete the invite from
   * @param invitee the recipient of the invitation you want to delete
   */
  @SuccessResponse('204', 'No content')
  @Delete('{id}/invitations/{invitee}')
  async deleteInvite(@Path() id: string, @Path() invitee: string): Promise<void> {
    return this.tableService.deleteInvite(id, invitee);
  }
}
